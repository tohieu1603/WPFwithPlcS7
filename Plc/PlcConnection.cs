using System.Collections.Concurrent;
using System.Windows;
using Microsoft.Extensions.Logging;
using S7.Net;
using VisionHmi.Generated;

namespace VisionHmi.Plc;

public enum LinkState { Disconnected, Connecting, Connected }

/// <summary>
/// Owns the S7 link on a dedicated background thread: reads STATUS/RECIPE/KPI/ALARM
/// every scan and raises <see cref="Updated"/> on the UI thread; command writes are
/// queued and executed by the worker. The UI never performs S7 I/O, so it never blocks.
/// </summary>
public sealed class PlcConnection
{
    private readonly ILogger<PlcConnection> _log;
    private readonly S7Endpoint _ep;
    private readonly ConcurrentQueue<Action> _writes = new();
    private Thread? _worker;
    private volatile bool _run;

    public string Host { get; set; } = "127.0.0.1";
    public CpuType Cpu { get; set; } = CpuType.S71500;
    public short Rack { get; set; } = 0;
    public short Slot { get; set; } = 1;
    public int ScanMs { get; set; } = 250;
    // Default S7 port 102; override with PLC_PORT to dodge a busy 102 (e.g. a Siemens service).
    public int Port { get; set; } =
        int.TryParse(Environment.GetEnvironmentVariable("PLC_PORT"), out var p) ? p : 102;

    public LinkState State { get; private set; } = LinkState.Disconnected;
    public event Action<PlcImage>? Updated;
    public event Action<LinkState>? StateChanged;

    public PlcConnection(ILogger<PlcConnection> log)
    {
        _log = log;
        _ep = new S7Endpoint(log);
    }

    public void Start()
    {
        if (_run) return;
        _run = true;
        _worker = new Thread(Loop) { IsBackground = true, Name = "PLC-Link" };
        _worker.Start();
        _log.LogInformation("PLC link worker started");
    }

    public void Stop()
    {
        _run = false;
        _worker?.Join(1000);
        _ep.Close();
        SetState(LinkState.Disconnected);
    }

    private void Loop()
    {
        while (_run)
        {
            if (!_ep.IsConnected)
            {
                SetState(LinkState.Connecting);
                if (!_ep.Open(Cpu, Host, Port, Rack, Slot)) { Thread.Sleep(1000); continue; }
                SetState(LinkState.Connected);
            }

            while (_writes.TryDequeue(out var w)) w();

            var img = ReadAll();
            if (img == null) { _ep.Close(); SetState(LinkState.Disconnected); continue; }
            Dispatch(() => Updated?.Invoke(img));

            Thread.Sleep(ScanMs);
        }
    }

    private PlcImage? ReadAll()
    {
        var dbs = new Dictionary<int, byte[]>(4);
        foreach (var (db, size) in new[] { (Db.Status, Db.SizeStatus), (Db.Recipe, Db.SizeRecipe),
                                           (Db.Kpi, Db.SizeKpi), (Db.Alarm, Db.SizeAlarm) })
        {
            var b = _ep.Read(db, 0, size);
            if (b == null) return null;
            dbs[db] = b;
        }
        return new PlcImage(dbs);
    }

    // ---- command writes (executed on the worker thread) ----
    public void Pulse(TagRef t) => WriteBit(t, true);

    public void WriteBit(TagRef t, bool on) => _writes.Enqueue(() =>
    {
        var cur = _ep.Read(t.Db, t.Byte, 1);
        if (cur == null) return;
        if (on) cur[0] |= (byte)(1 << t.Bit);
        else cur[0] &= (byte)~(1 << t.Bit);
        _ep.Write(t.Db, t.Byte, cur);
    });

    public void WriteReal(TagRef t, float v) => _writes.Enqueue(() => _ep.Write(t.Db, t.Byte, S7Codec.Real(v)));
    public void WriteInt(TagRef t, short v) => _writes.Enqueue(() => _ep.Write(t.Db, t.Byte, S7Codec.Int(v)));

    private void SetState(LinkState s)
    {
        if (State == s) return;
        State = s;
        _log.LogInformation("Link state -> {State}", s);
        Dispatch(() => StateChanged?.Invoke(s));
    }

    private static void Dispatch(Action a) => Application.Current?.Dispatcher.BeginInvoke(a);
}
