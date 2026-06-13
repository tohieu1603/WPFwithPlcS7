using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Generated;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

/// <summary>Line overview: PackML control, the eight stations and production KPI.</summary>
public partial class OverviewViewModel : LiveViewModel
{
    private static readonly string[] PmlNames =
    {
        "—", "CLEARING", "STOPPED", "STARTING", "IDLE", "SUSPENDED", "EXECUTE", "STOPPING",
        "ABORTING", "ABORTED", "HOLDING", "HELD", "UNHOLDING", "SUSPENDING", "UNSUSPENDING",
        "RESETTING", "COMPLETING", "COMPLETE"
    };
    private static readonly string[] ModeNames = { "—", "PRODUCTION", "MAINTENANCE", "MANUAL" };

    public ObservableCollection<StationViewModel> Stations { get; } = new();

    [ObservableProperty] private string _stateText = "—";
    [ObservableProperty] private string _modeText = "—";
    [ObservableProperty] private bool _running;
    [ObservableProperty] private double _lineRate;
    [ObservableProperty] private double _airPressure;

    [ObservableProperty] private int _good;
    [ObservableProperty] private int _reject;
    [ObservableProperty] private int _total;
    [ObservableProperty] private double _fpy;
    [ObservableProperty] private double _throughput;
    [ObservableProperty] private int _rejectBin;
    [ObservableProperty] private bool _rejectBinFull;

    public OverviewViewModel(PlcConnection plc) : base(plc)
    {
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

        Good = img.DInt(Tag.Good_Count);
        Reject = img.DInt(Tag.Reject_Count);
        Total = img.DInt(Tag.Total_Count);
        Fpy = img.Real(Tag.FirstPassYield);
        Throughput = img.Real(Tag.Throughput);
        RejectBin = img.Int(Tag.RejectBin_Count);
        RejectBinFull = img.Bool(Tag.RejectBin_Full);
    }

    [RelayCommand] private void Reset() => Plc.Pulse(Tag.Cmd_Reset);
    [RelayCommand] private void Start() => Plc.Pulse(Tag.Cmd_Start);
    [RelayCommand] private void Stop() => Plc.Pulse(Tag.Cmd_Stop);
    [RelayCommand] private void Hold() => Plc.Pulse(Tag.Cmd_Hold);
    [RelayCommand] private void Unhold() => Plc.Pulse(Tag.Cmd_Unhold);
    [RelayCommand] private void Abort() => Plc.Pulse(Tag.Cmd_Abort);
    [RelayCommand] private void Clear() => Plc.Pulse(Tag.Cmd_Clear);
    [RelayCommand] private void ModeProduction() => Plc.Pulse(Tag.Cmd_ModeProduction);
    [RelayCommand] private void ModeMaintenance() => Plc.Pulse(Tag.Cmd_ModeMaintenance);
    [RelayCommand] private void ModeManual() => Plc.Pulse(Tag.Cmd_ModeManual);
    [RelayCommand] private void ClearCounters() => Plc.Pulse(Tag.Cmd_ClearCounters);
    [RelayCommand] private void EmptyRejectBin() => Plc.Pulse(Tag.Cmd_EmptyRejectBin);
}
