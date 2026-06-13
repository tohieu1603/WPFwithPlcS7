using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using VisionHmi.Plc;
using VisionHmi.ViewModels;
using VisionHmi.Views;

namespace VisionHmi;

public partial class App : Application
{
    private ServiceProvider? _sp;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

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
        sc.AddSingleton<PlcConnection>();
        sc.AddSingleton<Services.MesReporter>();
        sc.AddSingleton<OverviewViewModel>();
        sc.AddSingleton<InspectionViewModel>();
        sc.AddSingleton<AlarmsViewModel>();
        sc.AddSingleton<RecipeViewModel>();
        sc.AddSingleton<ShellViewModel>();
        _sp = sc.BuildServiceProvider();

        // instantiate screens + the MES reporter so they subscribe before the scan starts
        _sp.GetRequiredService<OverviewViewModel>();
        _sp.GetRequiredService<InspectionViewModel>();
        _sp.GetRequiredService<AlarmsViewModel>();
        _sp.GetRequiredService<RecipeViewModel>();
        _sp.GetRequiredService<Services.MesReporter>();

        var vm = _sp.GetRequiredService<ShellViewModel>();
        new ShellWindow(vm).Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _sp?.GetService<PlcConnection>()?.Stop();
        _sp?.Dispose();
        Log.CloseAndFlush();
        base.OnExit(e);
    }
}
