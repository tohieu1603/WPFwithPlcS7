using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Generated;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

/// <summary>One station. Reused on Overview (read-only) and Manual control (jog).</summary>
public partial class StationViewModel : ObservableObject
{
    public static readonly (string Code, string Name)[] Defs =
    {
        ("ST10", "Infeed"), ("ST20", "Identify"), ("ST30", "Assembly"), ("ST40", "Vision"),
        ("ST50", "Marking"), ("ST60", "Verify"), ("ST70", "Reject"), ("ST80", "Outfeed"),
    };

    private readonly PlcConnection _plc;
    public string Code { get; }
    public string Name { get; }

    [ObservableProperty] private bool _run;
    [ObservableProperty] private bool _busy;
    [ObservableProperty] private bool _fault;
    [ObservableProperty] private bool _present;
    [ObservableProperty] private int _count;
    [ObservableProperty] private double _cycleTime;
    [ObservableProperty] private string _status = "IDLE";
    [ObservableProperty] private string _phase = "PENDING";   // PASSED | ACTIVE | PENDING (set by the line)
    [ObservableProperty] private bool _lineRunning;           // drives the belt animation

    public int Index { get; }

    public StationViewModel(string code, string name, PlcConnection plc)
    {
        Code = code; Name = name; _plc = plc;
        Index = Array.FindIndex(Defs, d => d.Code == code);
    }

    public void Update(PlcImage img)
    {
        Run = img.Bool(Ref("Run"));
        Busy = img.Bool(Ref("Busy"));
        Fault = img.Bool(Ref("Fault"));
        Present = img.Bool(Ref("PartPresent"));
        Count = img.DInt(Ref("Count"));
        CycleTime = img.Real(Ref("CycleTime"));
        Status = Fault ? "FAULT" : (Run || Busy) ? "RUN" : "IDLE";
    }

    [RelayCommand] private void RunStation() => _plc.WriteBit(Ref("ManRun"), true);
    [RelayCommand] private void StopStation() => _plc.WriteBit(Ref("ManRun"), false);
    [RelayCommand] private void ResetStation() => _plc.Pulse(Ref("Reset"));

    private TagRef Ref(string suffix) => Tag.ByName[$"{Code}_{suffix}"];
}
