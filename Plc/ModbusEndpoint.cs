using System.Net;
using FluentModbus;
using Microsoft.Extensions.Logging;

namespace VisionHmi.Plc;

/// <summary>
/// Minimal Modbus TCP client wrapper, accessed only from the connection worker thread.
/// Each block (Command/Status/Recipe/Kpi/Alarm) is a contiguous range of holding registers
/// at its own base (the generated RegBase map). Reads/writes are in whole 16-bit registers.
/// </summary>
public sealed class ModbusEndpoint
{
    private readonly ILogger _log;
    private readonly IReadOnlyDictionary<int, int> _regBase;   // db number -> holding-register base
    private ModbusTcpClient? _client;
    private byte _unit = 1;

    public ModbusEndpoint(ILogger log, IReadOnlyDictionary<int, int> regBase)
    {
        _log = log;
        _regBase = regBase;
    }

    public bool IsConnected => _client?.IsConnected ?? false;

    public bool Open(string ip, int port, byte unit)
    {
        try
        {
            _unit = unit;
            _client = new ModbusTcpClient { ReadTimeout = 2000, WriteTimeout = 2000 };
            _client.Connect(new IPEndPoint(IPAddress.Parse(ip), port), ModbusEndianness.BigEndian);
            if (_client.IsConnected) _log.LogInformation("Modbus connected {Ip}:{Port} unit {Unit}", ip, port, unit);
            return _client.IsConnected;
        }
        catch (Exception ex)
        {
            _log.LogWarning("Modbus connect failed: {Msg}", ex.Message);
            _client = null;
            return false;
        }
    }

    public void Close()
    {
        try { _client?.Disconnect(); } catch { /* ignore */ }
        _client = null;
    }

    /// <summary>Read <paramref name="count"/> holding registers from DB <paramref name="db"/>
    /// at register offset <paramref name="regOffset"/> within its block.</summary>
    public ushort[]? ReadRegs(int db, int regOffset, int count)
    {
        try
        {
            if (_client?.IsConnected != true || !_regBase.TryGetValue(db, out var b)) return null;

            int abs = b + regOffset;
            _log.LogInformation("MODBUS  FC03 read   addr 4{Addr:D5}  count {Count}", abs + 1, count);
            Span<byte> bytes = _client.ReadHoldingRegisters(_unit, (ushort)abs, (ushort)count);
            var regs = new ushort[count];
            for (int i = 0; i < count; i++)
                regs[i] = (ushort)((bytes[2 * i] << 8) | bytes[2 * i + 1]);   // big-endian register
            return regs;
        }
        catch (Exception ex) { _log.LogDebug("Modbus read DB{Db} failed: {Msg}", db, ex.Message); return null; }
    }

    public bool WriteRegs(int db, int regOffset, ushort[] values)
    {
        try
        {
            if (_client?.IsConnected != true || !_regBase.TryGetValue(db, out var b)) return false;

            int abs = b + regOffset;
            _log.LogInformation("MODBUS  FC16 write  addr 4{Addr:D5}  = [{Vals}]", abs + 1, string.Join(",", values));
            var s = new short[values.Length];
            for (int i = 0; i < values.Length; i++) s[i] = (short)values[i];
            _client.WriteMultipleRegisters(_unit, abs, s);
            return true;
        }
        catch (Exception ex) { _log.LogWarning("Modbus write DB{Db} failed: {Msg}", db, ex.Message); return false; }
    }
}
