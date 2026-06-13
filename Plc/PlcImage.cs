using System.Buffers.Binary;
using System.Text;
using VisionHmi.Generated;

namespace VisionHmi.Plc;

/// <summary>
/// Immutable snapshot of the PLC data blocks read in one scan. Decodes values by
/// <see cref="TagRef"/> using big-endian (Siemens) layout, including S7 STRING.
/// One decode path for the whole HMI.
/// </summary>
public sealed class PlcImage
{
    private readonly IReadOnlyDictionary<int, byte[]> _dbs;
    public PlcImage(IReadOnlyDictionary<int, byte[]> dbs) => _dbs = dbs;
    public static PlcImage Empty { get; } = new(new Dictionary<int, byte[]>());

    private ReadOnlySpan<byte> Slice(TagRef t, int n)
    {
        if (_dbs.TryGetValue(t.Db, out var b) && t.Byte + n <= b.Length)
            return b.AsSpan(t.Byte, n);
        return new byte[n];
    }

    public bool Bool(TagRef t)
    {
        if (_dbs.TryGetValue(t.Db, out var b) && t.Byte < b.Length)
            return (b[t.Byte] & (1 << t.Bit)) != 0;
        return false;
    }

    public short Int(TagRef t) => BinaryPrimitives.ReadInt16BigEndian(Slice(t, 2));
    public ushort Word(TagRef t) => BinaryPrimitives.ReadUInt16BigEndian(Slice(t, 2));
    public int DInt(TagRef t) => BinaryPrimitives.ReadInt32BigEndian(Slice(t, 4));
    public float Real(TagRef t) => BinaryPrimitives.ReadSingleBigEndian(Slice(t, 4));

    /// <summary>S7 STRING: byte[0]=max, byte[1]=current length, then ASCII chars.</summary>
    public string Str(TagRef t)
    {
        if (!_dbs.TryGetValue(t.Db, out var b) || t.Byte + 2 > b.Length) return string.Empty;
        int len = b[t.Byte + 1];
        int start = t.Byte + 2;
        if (start + len > b.Length) len = Math.Max(0, b.Length - start);
        return Encoding.ASCII.GetString(b, start, len);
    }

    public double Number(TagRef t) => t.Kind switch
    {
        TagKind.Real => Real(t),
        TagKind.Int => Int(t),
        TagKind.Word => Word(t),
        TagKind.DInt => DInt(t),
        _ => 0
    };
}
