using System;
using System.Windows;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using VisionHmi.Data;
using VisionHmi.Plc;
using VisionHmi.Services;
using VisionHmi.Stores;
using VisionHmi.ViewModels;
using VisionHmi.Views;

namespace VisionHmi;

public partial class App : Application
{
    private ServiceProvider? _sp;
    private AuthStore? _auth;
    private Window? _currentWindow;

    protected override async void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        // We manage windows manually (Login <-> Shell), so don't auto-shutdown on window close.
        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        // ----- Serilog: console + daily rolling file -----
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console()
            .WriteTo.File("logs/hmi-.log", rollingInterval: RollingInterval.Day,
                outputTemplate: "{Timestamp:HH:mm:ss} {Level:u3} {SourceContext} | {Message:lj}{NewLine}{Exception}")
            .CreateLogger();
        Log.Information("VisionHmi starting");

        var sc = new ServiceCollection();
        sc.AddLogging(b => { b.ClearProviders(); b.AddSerilog(Log.Logger, dispose: true); });

        // ----- Auth database: dedicated PostgreSQL (Docker, host port 5433) -----
        var conn = Environment.GetEnvironmentVariable("HMI_DB")
            ?? "Host=localhost;Port=5433;Database=visionhmi;Username=hmi;Password=hmi";
        sc.AddDbContextFactory<AppDbContext>(o => o.UseNpgsql(conn));
        sc.AddSingleton<AuthStore>();
        sc.AddSingleton<AuthService>();
        sc.AddSingleton<UserService>();
        sc.AddTransient<LoginViewModel>();

        // ----- PLC link + monitoring screens -----
        sc.AddSingleton<PlcConnection>();
        sc.AddSingleton<Services.MesReporter>();
        sc.AddSingleton<OverviewViewModel>();
        sc.AddSingleton<InspectionViewModel>();
        sc.AddSingleton<AlarmsViewModel>();
        sc.AddSingleton<RecipeViewModel>();
        sc.AddSingleton<UsersViewModel>();
        sc.AddSingleton<ShellViewModel>();
        _sp = sc.BuildServiceProvider();

        // ----- create the schema + seed the default admin (admin / admin123) -----
        try
        {
            await _sp.GetRequiredService<AuthService>().EnsureSeededAsync();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "Không kết nối được PostgreSQL.\nKiểm tra Docker đã chạy chưa (port 5433):\n" +
                "  docker compose -f VisionHmi/docker-compose.yml up -d\n\n" + ex.Message,
                "Lỗi cơ sở dữ liệu", MessageBoxButton.OK, MessageBoxImage.Error);
            Shutdown();
            return;
        }

        _auth = _sp.GetRequiredService<AuthStore>();
        _auth.CurrentUserChanged += OnAuthChanged;

        ShowLogin();
    }

    private void OnAuthChanged() =>
        Dispatcher.Invoke(() => { if (_auth!.IsLoggedIn) ShowShell(); else ShowLogin(); });

    private void ShowShell()
    {
        // resolve the MES reporter so it subscribes to PLC updates before the scan starts
        _sp!.GetRequiredService<MesReporter>();
        SwapTo(new ShellWindow(_sp.GetRequiredService<ShellViewModel>()));
    }

    private void ShowLogin() =>
        SwapTo(new LoginWindow(_sp!.GetRequiredService<LoginViewModel>()));

    /// <summary>Show the new window, then close the old one. Detaching the close handler
    /// first means a programmatic swap does not shut the app down; only the user closing
    /// the active window (via X) does.</summary>
    private void SwapTo(Window w)
    {
        w.Closed += OnActiveWindowClosed;
        w.Show();
        if (_currentWindow is { } old)
        {
            old.Closed -= OnActiveWindowClosed;
            old.Close();
        }
        _currentWindow = w;
    }

    private void OnActiveWindowClosed(object? sender, EventArgs e) => Shutdown();

    protected override void OnExit(ExitEventArgs e)
    {
        _sp?.GetService<PlcConnection>()?.Stop();
        _sp?.Dispose();
        Log.CloseAndFlush();
        base.OnExit(e);
    }
}
