using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

/// <summary>Application shell: navigation, connection lifecycle and link status.</summary>
public partial class ShellViewModel : ObservableObject
{
    private readonly PlcConnection _plc;
    private readonly ILogger<ShellViewModel> _log;

    public OverviewViewModel Overview { get; }
    public InspectionViewModel Inspection { get; }
    public AlarmsViewModel Alarms { get; }
    public RecipeViewModel Recipe { get; }

    [ObservableProperty] private object _current;
    [ObservableProperty] private string _activeNav = "Overview";
    [ObservableProperty] private string _linkText = "DISCONNECTED";
    [ObservableProperty] private bool _connected;

    public ShellViewModel(PlcConnection plc, ILogger<ShellViewModel> log,
        OverviewViewModel overview, InspectionViewModel inspection,
        AlarmsViewModel alarms, RecipeViewModel recipe)
    {
        _plc = plc; _log = log;
        Overview = overview; Inspection = inspection; Alarms = alarms; Recipe = recipe;
        _current = overview;

        plc.StateChanged += s =>
        {
            Connected = s == LinkState.Connected;
            LinkText = s switch
            {
                LinkState.Connected => $"PLC {plc.Host}  CONNECTED",
                LinkState.Connecting => "CONNECTING…",
                _ => "DISCONNECTED"
            };
        };
    }

    public void Start()
    {
        _log.LogInformation("HMI starting PLC link");
        _plc.Start();
    }

    [RelayCommand] private void NavOverview() { Current = Overview; ActiveNav = "Overview"; }
    [RelayCommand] private void NavInspection() { Current = Inspection; ActiveNav = "Inspection"; }
    [RelayCommand] private void NavAlarms() { Current = Alarms; ActiveNav = "Alarms"; }
    [RelayCommand] private void NavRecipe() { Current = Recipe; ActiveNav = "Recipe"; }
}
