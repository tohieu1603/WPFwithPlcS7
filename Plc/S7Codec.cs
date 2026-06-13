using System.Buffers.Binary;

namespace VisionHmi.Plc;

/// <summary>Big-endian (Siemens S7) encoders for writing values to a data block.</summary>
public static class S7Codec
{
    public static byte[] Real(float v) { var a = new byte[4]; BinaryPrimitives.WriteSingleBigEndian(a, v); return a; }
    public static byte[] Int(short v) { var a = new byte[2]; BinaryPrimitives.WriteInt16BigEndian(a, v); return a; }
    public static byte[] DInt(int v) { var a = new byte[4]; BinaryPrimitives.WriteInt32BigEndian(a, v); return a; }
}
