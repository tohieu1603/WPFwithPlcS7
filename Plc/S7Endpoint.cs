using Microsoft.Extensions.Logging;
using S7.Net;

namespace VisionHmi.Plc;

/// <summary>Minimal S7netplus wrapper, accessed only from the connection worker thread.</summary>
public sealed class S7Endpoint
{
    private readonly ILogger _log;
    private S7.Net.Plc? _plc;

    public S7Endpoint(ILogger log) => _log = log;

    public bool IsConnected => _plc?.IsConnected ?? false;

    public bool Open(CpuType cpu, string ip, short rack, short slot)
    {
        try
        {
            _plc = new S7.Net.Plc(cpu, ip, rack, slot);
            _plc.Open();
            if (_plc.IsConnected) _log.LogInformation("S7 connected {Ip} rack {Rack}/slot {Slot}", ip, rack, slot);
            return _plc.IsConnected;
        }
        catch (Exception ex)
        {
            _log.LogWarning("S7 connect failed: {Msg}", ex.Message);
            _plc = null;
            return false;
        }
    }

    public void Close()
    {
        try { _plc?.Close(); } catch { /* ignore */ }
        _plc = null;
    }

    public byte[]? Read(int db, int start, int len)
    {
        try
        {
            if (_plc?.IsConnected == true)
                return _plc.ReadBytes(DataType.DataBlock, db, start, len);
        }
        catch (Exception ex) { _log.LogDebug("read DB{Db} failed: {Msg}", db, ex.Message); }
        return null;
    }

    public bool Write(int db, int start, byte[] data)
    {
        try
        {
            if (_plc?.IsConnected == true) { _plc.WriteBytes(DataType.DataBlock, db, start, data); return true; }
        }
        catch (Exception ex) { _log.LogWarning("write DB{Db} failed: {Msg}", db, ex.Message); }
        return false;
    }
}
