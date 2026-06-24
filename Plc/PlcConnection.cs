using System.Collections.Concurrent;
using System.Windows;
using Microsoft.Extensions.Logging;
using VisionHmi.Generated;

namespace VisionHmi.Plc;

public enum LinkState { Disconnected, Connecting, Connected }

/// <summary>
/// Owns the Modbus TCP link on a dedicated background thread: reads STATUS/RECIPE/KPI/ALARM
/// every scan and raises <see cref="Updated"/> on the UI thread; command writes are queued
/// and executed by the worker. The UI never performs I/O, so it never blocks.
/// </summary>
public sealed class PlcConnection
{
    // Holding-register base for each DB block (generated from tags.py — single source of truth).
    private static readonly IReadOnlyDictionary<int, int> RegBase = new Dictionary<int, int>
    {
        { Db.Command, Db.RegBaseCommand },
        { Db.Status,  Db.RegBaseStatus },
        { Db.Recipe,  Db.RegBaseRecipe },
        { Db.Kpi,     Db.RegBaseKpi },
        { Db.Alarm,   Db.RegBaseAlarm },
    };

    private readonly ILogger<PlcConnection> _log;
    private readonly ModbusEndpoint _ep;
    private readonly ConcurrentQueue<Action> _writes = new();
    private Thread? _worker;
    private volatile bool _run;

    // Modbus target. Override Host with PLC_HOST, port with PLC_PORT, unit id with PLC_UNIT.
    public string Host { get; set; } = Environment.GetEnvironmentVariable("PLC_HOST") ?? "127.0.0.1";
    // Standard Modbus TCP port 502; override with PLC_PORT (e.g. 1502 for a non-privileged test).
    public int Port { get; set; } =
        int.TryParse(Environment.GetEnvironmentVariable("PLC_PORT"), out var p) ? p : 502;
    public byte UnitId { get; set; } =
        byte.TryParse(Environment.GetEnvironmentVariable("PLC_UNIT"), out var u) ? u : (byte)1;
    public int ScanMs { get; set; } = 250;
    // How long a Pulse() holds the command bit high before clearing it. Long enough that the
    // PLC's cyclic scan reliably catches the rising edge; override with PLC_PULSE_MS.
    public int PulseHoldMs { get; set; } =
        int.TryParse(Environment.GetEnvironmentVariable("PLC_PULSE_MS"), out var ms) ? ms : 200;

    public LinkState State { get; private set; } = LinkState.Disconnected;
    public event Action<PlcImage>? Updated;
    public event Action<LinkState>? StateChanged;

    public PlcConnection(ILogger<PlcConnection> log)
    {
        _log = log;
        _ep = new ModbusEndpoint(log, RegBase);
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
                if (!_ep.Open(Host, Port, UnitId)) { Thread.Sleep(1000); continue; }
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
        var dbs = new Dictionary<int, ushort[]>(4);
        foreach (var (db, size) in new[] { (Db.Status, Db.SizeStatus), (Db.Recipe, Db.SizeRecipe),
                                           (Db.Kpi, Db.SizeKpi), (Db.Alarm, Db.SizeAlarm) })
        {
            var r = _ep.ReadRegs(db, 0, size);
            if (r == null) return null;
            dbs[db] = r;
        }
        return new PlcImage(dbs);
    }

    // ---- command writes (executed on the worker thread), in whole 16-bit registers ----

    /// <summary>Momentary command: set the bit, hold it briefly so the PLC scan reliably
    /// catches the rising edge, then clear it back to 0. A true "nhấp" pulse — not
    /// set-and-hold — so the button works on every press even if the PLC never self-resets
    /// the bit. The brief Thread.Sleep runs on the worker thread, so the UI never blocks.</summary>
    public void Pulse(TagRef t) => _writes.Enqueue(() =>
    {
        if (!SetBit(t, true)) return;     // set the edge
        Thread.Sleep(PulseHoldMs);        // hold so the PLC sees it
        SetBit(t, false);                 // and release it
    });

    public void WriteBit(TagRef t, bool on) => _writes.Enqueue(() => SetBit(t, on));

    /// <summary>Read-modify-write a single bit so the other bits in the register are preserved.</summary>
    private bool SetBit(TagRef t, bool on)
    {
        var cur = _ep.ReadRegs(t.Db, t.Reg, 1);
        if (cur == null) return false;
        ushort w = cur[0];
        if (on) w |= (ushort)(1 << t.Bit);
        else    w &= (ushort)~(1 << t.Bit);
        return _ep.WriteRegs(t.Db, t.Reg, new[] { w });
    }

    public void WriteInt(TagRef t, short v) => _writes.Enqueue(() => _ep.WriteRegs(t.Db, t.Reg, new[] { (ushort)v }));

    public void WriteReal(TagRef t, float v) => _writes.Enqueue(() =>
    {
        var b = new byte[4];
        System.Buffers.Binary.BinaryPrimitives.WriteSingleBigEndian(b, v);   // high word first
        _ep.WriteRegs(t.Db, t.Reg, new[] { (ushort)((b[0] << 8) | b[1]), (ushort)((b[2] << 8) | b[3]) });
    });

    private void SetState(LinkState s)
    {
        if (State == s) return;
        State = s;
        _log.LogInformation("Link state -> {State}", s);
        Dispatch(() => StateChanged?.Invoke(s));
    }

    private static void Dispatch(Action a) => Application.Current?.Dispatcher.BeginInvoke(a);
}
