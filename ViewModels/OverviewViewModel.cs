using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Media;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Generated;
using VisionHmi.Plc;
using VisionHmi.Stores;

namespace VisionHmi.ViewModels;

/// <summary>Line overview / process mimic: PackML control, the eight-station conveyor,
/// the live scan + inspection results travelling down the line, and production KPI.</summary>
public partial class OverviewViewModel : LiveViewModel
{
    private static readonly string[] PmlNames =
    {
        "—", "CLEARING", "STOPPED", "STARTING", "IDLE", "SUSPENDED", "EXECUTE", "STOPPING",
        "ABORTING", "ABORTED", "HOLDING", "HELD", "UNHOLDING", "SUSPENDING", "UNSUSPENDING",
        "RESETTING", "COMPLETING", "COMPLETE"
    };
    private static readonly string[] ModeNames = { "—", "PRODUCTION", "MAINTENANCE", "MANUAL" };
    private static readonly string[] Disp = { "IN-PROCESS", "PASS", "FAIL", "REWORK" };
    private static readonly string[] Grades = { "F", "D", "C", "B", "A", "A+" };

    private const int TrendWidth = 300, TrendHeight = 64, TrendSamples = 90;
    private readonly List<double> _trend = new();

    public ObservableCollection<StationViewModel> Stations { get; } = new();

    [ObservableProperty] private string _stateText = "—";
    [ObservableProperty] private string _modeText = "—";
    [ObservableProperty] private bool _running;
    [ObservableProperty] private double _lineRate;
    [ObservableProperty] private double _airPressure;

    // Live scan / inspection following the part down the line
    [ObservableProperty] private string _barcodeData = "";
    [ObservableProperty] private bool _barcodeOk;
    [ObservableProperty] private bool _barcodeNoRead;
    [ObservableProperty] private string _barcodeGrade = "—";
    [ObservableProperty] private bool _visionPass;
    [ObservableProperty] private bool _visionFail;
    [ObservableProperty] private double _visionScore;
    [ObservableProperty] private double _gap;
    [ObservableProperty] private string _markedSerial = "";
    [ObservableProperty] private bool _verifyMatch;
    [ObservableProperty] private string _currentSerial = "";
    [ObservableProperty] private string _currentProduct = "";
    [ObservableProperty] private string _dispositionText = "—";

    [ObservableProperty] private int _good;
    [ObservableProperty] private int _reject;
    [ObservableProperty] private int _total;
    [ObservableProperty] private double _fpy;
    [ObservableProperty] private double _throughput;
    [ObservableProperty] private int _rejectBin;
    [ObservableProperty] private bool _rejectBinFull;
    [ObservableProperty] private int _activeAlarms;
    [ObservableProperty] private PointCollection _trendPoints = new();

    private readonly AuthStore _auth;

    public OverviewViewModel(PlcConnection plc, AuthStore auth) : base(plc)
    {
        _auth = auth;
        foreach (var (code, name) in StationViewModel.Defs)
            Stations.Add(new StationViewModel(code, name, plc));
    }

    protected override void OnImage(PlcImage img)
    {
        foreach (var s in Stations) s.Update(img);
        int st = img.Int(Tag.PML_State), md = img.Int(Tag.PML_Mode);
        StateText = st >= 0 && st < PmlNames.Length ? PmlNames[st] : st.ToString();
        ModeText = md >= 0 && md < ModeNames.Length ? ModeNames[md] : md.ToString();
        Running = img.Bool(Tag.Line_Running);
        LineRate = img.Real(Tag.Line_Rate);
        AirPressure = img.Real(Tag.AirPressure);

        UpdateFlowPhases();

        BarcodeOk = img.Bool(Tag.BCR_ReadOK);
        BarcodeNoRead = img.Bool(Tag.BCR_NoRead);
        BarcodeData = img.Str(Tag.BCR_Data);
        BarcodeGrade = GradeText(img.Int(Tag.BCR_Grade));
        VisionPass = img.Bool(Tag.VIS_Pass);
        VisionFail = img.Bool(Tag.VIS_Fail);
        VisionScore = img.Real(Tag.VIS_MatchScore);
        Gap = img.Real(Tag.VIS_Measure1);
        MarkedSerial = img.Str(Tag.MRK_Serial);
        VerifyMatch = img.Bool(Tag.VFY_Match);
        CurrentSerial = img.Str(Tag.Cur_Serial);
        CurrentProduct = img.Str(Tag.Cur_ProductId);
        int d = img.Int(Tag.Cur_Disposition);
        DispositionText = d >= 0 && d < Disp.Length ? Disp[d] : "—";

        Good = img.DInt(Tag.Good_Count);
        Reject = img.DInt(Tag.Reject_Count);
        Total = img.DInt(Tag.Total_Count);
        Fpy = img.Real(Tag.FirstPassYield);
        Throughput = img.Real(Tag.Throughput);
        RejectBin = img.Int(Tag.RejectBin_Count);
        RejectBinFull = img.Bool(Tag.RejectBin_Full);
        ActiveAlarms = img.Int(Tag.Active_Alarm_Count);

        PushTrend(Throughput);
    }

    /// <summary>Mark each station PASSED / ACTIVE / PENDING relative to the leading part,
    /// and propagate the running flag so the belt animation only runs while executing.</summary>
    private void UpdateFlowPhases()
    {
        int lead = -1;
        foreach (var s in Stations)
            if (s.Present || s.Busy) lead = System.Math.Max(lead, s.Index);

        foreach (var s in Stations)
        {
            s.LineRunning = Running;
            s.Phase = (s.Present || s.Busy) ? "ACTIVE"
                    : (lead >= 0 && s.Index < lead) ? "PASSED"
                    : "PENDING";
        }
    }

    private void PushTrend(double value)
    {
        _trend.Add(value);
        if (_trend.Count > TrendSamples) _trend.RemoveAt(0);

        double max = 1;
        foreach (var v in _trend) if (v > max) max = v;

        var pts = new PointCollection();
        double dx = (double)TrendWidth / System.Math.Max(1, TrendSamples - 1);
        for (int i = 0; i < _trend.Count; i++)
        {
            double x = i * dx;
            double y = TrendHeight - _trend[i] / max * (TrendHeight - 4) - 2;
            pts.Add(new Point(x, y));
        }
        pts.Freeze();
        TrendPoints = pts;
    }

    private static string GradeText(int g) => g >= 0 && g < Grades.Length ? Grades[g] : "—";

    // ---- PackML control. Disruptive commands ask for confirmation; destructive/safety
    //      commands also require the Admin role. Routine run commands go straight through. ----
    [RelayCommand] private void Reset() => Send("RESET", Tag.Cmd_Reset);
    [RelayCommand] private void Start() => Send("START", Tag.Cmd_Start);
    [RelayCommand] private void Stop() => Send("STOP", Tag.Cmd_Stop, confirm: true);
    [RelayCommand] private void Hold() => Send("HOLD", Tag.Cmd_Hold);
    [RelayCommand] private void Unhold() => Send("UNHOLD", Tag.Cmd_Unhold);
    [RelayCommand] private void Abort() => Send("ABORT", Tag.Cmd_Abort, confirm: true, adminOnly: true);
    [RelayCommand] private void Clear() => Send("CLEAR", Tag.Cmd_Clear);
    [RelayCommand] private void ModeProduction() => Send("MODE: PRODUCTION", Tag.Cmd_ModeProduction);
    [RelayCommand] private void ModeMaintenance() => Send("MODE: MAINTENANCE", Tag.Cmd_ModeMaintenance, confirm: true, adminOnly: true);
    [RelayCommand] private void ModeManual() => Send("MODE: MANUAL", Tag.Cmd_ModeManual, confirm: true, adminOnly: true);
    [RelayCommand] private void ClearCounters() => Send("CLEAR COUNTERS", Tag.Cmd_ClearCounters, confirm: true, adminOnly: true);
    [RelayCommand] private void EmptyRejectBin() => Send("EMPTY REJECT BIN", Tag.Cmd_EmptyRejectBin, confirm: true);

    /// <summary>Gate a control command before it reaches the PLC: Admin-only commands are
    /// blocked for operators, and disruptive commands ask for confirmation first. Only when
    /// both checks pass is the momentary pulse sent.</summary>
    private void Send(string label, TagRef cmd, bool confirm = false, bool adminOnly = false)
    {
        if (adminOnly && !_auth.IsAdmin)
        {
            MessageBox.Show(
                $"Lệnh \"{label}\" yêu cầu quyền Admin.\nTài khoản hiện tại có quyền: {_auth.CurrentUser?.Role ?? "—"}.",
                "Không đủ quyền", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (confirm &&
            MessageBox.Show($"Xác nhận thực hiện lệnh \"{label}\"?", "Xác nhận lệnh",
                MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        Plc.Pulse(cmd);
    }
}
