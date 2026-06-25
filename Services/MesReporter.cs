using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using VisionHmi.Generated;
using VisionHmi.Plc;

namespace VisionHmi.Services;

/// <summary>
/// Pushes line data from the HMI up to the MES backend: machine state and KPI on a
/// throttle, a traceability record when a unit completes, and the active-alarm set.
/// Fire-and-forget over HTTP; failures are logged and never affect the HMI.
/// </summary>
public sealed class MesReporter
{
    private static readonly string[] PmlNames =
    [
        "-", "CLEARING", "STOPPED", "STARTING", "IDLE", "SUSPENDED", "EXECUTE", "STOPPING",
        "ABORTING", "ABORTED", "HOLDING", "HELD", "UNHOLDING", "SUSPENDING", "UNSUSPENDING",
        "RESETTING", "COMPLETING", "COMPLETE"
    ];
    private static readonly string[] ModeNames = ["-", "PRODUCTION", "MAINTENANCE", "MANUAL"];
    private static readonly string[] Grades = ["F", "D", "C", "B", "A", "A+"];

    private readonly HttpClient _http;
    private readonly ILogger<MesReporter> _log;

    private DateTime _lastPush = DateTime.MinValue;
    private string _lastSerial = "";

    public MesReporter(PlcConnection plc, ILogger<MesReporter> log)
    {
        _log = log;
        _http = new HttpClient
        {
            BaseAddress = new Uri(Environment.GetEnvironmentVariable("MES_URL") ?? "http://localhost:4000/api/"),
            Timeout = TimeSpan.FromSeconds(3),
        };
        plc.Updated += OnImage;
        _log.LogInformation("MES reporter -> {Url}", _http.BaseAddress);
    }

    private async void OnImage(PlcImage img)
    {
        try
        {
            await ReportRecordIfComplete(img);

            if ((DateTime.Now - _lastPush).TotalMilliseconds < 2000) return;
            _lastPush = DateTime.Now;

            await Post("ingest/state", new
            {
                state = Text(PmlNames, img.Int(Tag.PML_State)),
                mode = Text(ModeNames, img.Int(Tag.PML_Mode)),
                running = img.Bool(Tag.Line_Running),
                lineRate = img.Real(Tag.Line_Rate),
                airPressure = img.Real(Tag.AirPressure),
                activeAlarms = img.Int(Tag.Active_Alarm_Count),
            });

            await Post("ingest/kpi", new
            {
                good = img.DInt(Tag.Good_Count),
                reject = img.DInt(Tag.Reject_Count),
                total = img.DInt(Tag.Total_Count),
                fpy = img.Real(Tag.FirstPassYield),
                throughput = img.Real(Tag.Throughput),
                rejVision = img.DInt(Tag.Rej_Vision),
                rejBarcode = img.DInt(Tag.Rej_Barcode),
                rejVerify = img.DInt(Tag.Rej_Verify),
                rejAssembly = img.DInt(Tag.Rej_Assembly),
                runtime = img.DInt(Tag.Runtime_s),
                downtime = img.DInt(Tag.Downtime_s),
            });

            await Post("ingest/alarms", new { active = ActiveAlarms(img) });
            await Post("ingest/stations", new { stations = Stations(img) });
        }
        catch (Exception ex)
        {
            _log.LogDebug("MES push failed: {Msg}", ex.Message);
        }
    }

    private async Task ReportRecordIfComplete(PlcImage img)
    {
        int disp = img.Int(Tag.Cur_Disposition);          // 0 in-process, 1 PASS, 2 FAIL
        string serial = img.Str(Tag.Cur_Serial);
        if (disp == 0 || string.IsNullOrEmpty(serial) || serial == _lastSerial) return;
        _lastSerial = serial;

        await Post("ingest/record", new
        {
            serial,
            product = img.Str(Tag.Cur_ProductId),
            barcode = img.Str(Tag.BCR_Data),
            visionPass = img.Bool(Tag.VIS_Pass),
            visionScore = img.Real(Tag.VIS_MatchScore),
            gap = img.Real(Tag.VIS_Measure1),
            bore = img.Real(Tag.VIS_Measure2),
            grade = Text(Grades, img.Int(Tag.VFY_Grade)),
            disposition = disp == 1 ? "PASS" : disp == 2 ? "FAIL" : "REWORK",
            failReason = disp == 2 ? FailReason(img) : "",
        });
    }

    private static object[] Stations(PlcImage img)
    {
        List<object> list = [];
        foreach (var (code, name) in ViewModels.StationViewModel.Defs)
        {
            bool fault = img.Bool(Tag.ByName[$"{code}_Fault"]);
            bool run = img.Bool(Tag.ByName[$"{code}_Run"]) || img.Bool(Tag.ByName[$"{code}_Busy"]);
            list.Add(new
            {
                code,
                name,
                status = fault ? "FAULT" : run ? "RUN" : "IDLE",
                fault,
                count = img.DInt(Tag.ByName[$"{code}_Count"]),
                cycleTime = img.Real(Tag.ByName[$"{code}_CycleTime"]),
            });
        }
        return list.ToArray();
    }

    private static object[] ActiveAlarms(PlcImage img)
    {
        int[] words = [img.Word(Tag.Alarm_Word0), img.Word(Tag.Alarm_Word1)];
        List<object> list = [];
        foreach (var a in AlarmCatalog.All)
            if ((words[a.Word] & (1 << a.Bit)) != 0)
                list.Add(new { name = a.Name, priority = a.Priority, station = a.Station, description = a.Description });
        return list.ToArray();
    }

    private static string FailReason(PlcImage img) =>
        img.Bool(Tag.VIS_Fail) ? "vision" :
        img.Bool(Tag.BCR_NoRead) ? "barcode" :
        !img.Bool(Tag.VFY_Match) ? "verify" : "assembly";

    private static string Text(string[] table, int i) => i >= 0 && i < table.Length ? table[i] : i.ToString();

    private Task Post(string path, object body) => _http.PostAsJsonAsync(path, body);
}
