using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using VisionHmi.Plc;
using VisionHmi.Stores;

namespace VisionHmi.ViewModels;

/// <summary>Application shell: navigation, connection lifecycle, link status and the
/// signed-in user (logout + admin-only Users tab).</summary>
public partial class ShellViewModel : ObservableObject
{
    private readonly PlcConnection _plc;
    private readonly ILogger<ShellViewModel> _log;
    private readonly AuthStore _auth;

    public OverviewViewModel Overview { get; }
    public InspectionViewModel Inspection { get; }
    public AlarmsViewModel Alarms { get; }
    public RecipeViewModel Recipe { get; }
    public UsersViewModel Users { get; }

    [ObservableProperty] private object _current;
    [ObservableProperty] private string _activeNav = "Overview";
    [ObservableProperty] private string _linkText = "DISCONNECTED";
    [ObservableProperty] private bool _connected;

    public string CurrentUserName => _auth.CurrentUser?.FullName is { Length: > 0 } n ? n : _auth.CurrentUser?.Username ?? "";
    public string CurrentUserRole => _auth.CurrentUser?.Role ?? "";
    public bool IsAdmin => _auth.IsAdmin;

    public ShellViewModel(PlcConnection plc, ILogger<ShellViewModel> log, AuthStore auth,
        OverviewViewModel overview, InspectionViewModel inspection,
        AlarmsViewModel alarms, RecipeViewModel recipe, UsersViewModel users)
    {
        _plc = plc; _log = log; _auth = auth;
        Overview = overview; Inspection = inspection; Alarms = alarms; Recipe = recipe; Users = users;
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
    [RelayCommand] private void NavUsers() { Current = Users; ActiveNav = "Users"; }

    [RelayCommand] private void Logout() => _auth.Logout();
}
