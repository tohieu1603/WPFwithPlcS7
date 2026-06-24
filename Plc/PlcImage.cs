using System.Buffers.Binary;
using System.Text;
using VisionHmi.Generated;

namespace VisionHmi.Plc;

/// <summary>
/// Immutable snapshot of the Modbus holding-register blocks read in one scan. Decodes
/// values by <see cref="TagRef"/> using the documented register map (MODBUS_REGISTER_MAP.md):
/// 16-bit big-endian registers; 32-bit values (DInt/Real) span two registers, high word
/// first; strings pack two ASCII chars per register (high byte = first char), NUL-padded.
/// </summary>
public sealed class PlcImage
{
    private readonly IReadOnlyDictionary<int, ushort[]> _regs;
    public PlcImage(IReadOnlyDictionary<int, ushort[]> regs) => _regs = regs;
    public static PlcImage Empty { get; } = new(new Dictionary<int, ushort[]>());

    private ushort Reg(TagRef t, int i)
    {
        if (_regs.TryGetValue(t.Db, out var r) && t.Reg + i < r.Length) return r[t.Reg + i];
        return 0;
    }

    public bool Bool(TagRef t) => (Reg(t, 0) & (1 << t.Bit)) != 0;
    public short Int(TagRef t) => (short)Reg(t, 0);
    public ushort Word(TagRef t) => Reg(t, 0);
    public int DInt(TagRef t) => (int)(((uint)Reg(t, 0) << 16) | Reg(t, 1));

    public float Real(TagRef t)
    {
        Span<byte> b = stackalloc byte[4];
        BinaryPrimitives.WriteUInt16BigEndian(b, Reg(t, 0));        // high word first
        BinaryPrimitives.WriteUInt16BigEndian(b[2..], Reg(t, 1));
        return BinaryPrimitives.ReadSingleBigEndian(b);
    }

    /// <summary>Plain Modbus string: 2 ASCII chars per register, high byte first, NUL-terminated.</summary>
    public string Str(TagRef t)
    {
        int nreg = (t.Len + 1) / 2;
        var b = new byte[nreg * 2];
        for (int i = 0; i < nreg; i++)
        {
            ushort w = Reg(t, i);
            b[2 * i] = (byte)(w >> 8);
            b[2 * i + 1] = (byte)(w & 0xFF);
        }
        int len = 0;
        while (len < t.Len && b[len] != 0) len++;                  // stop at NUL
        return Encoding.ASCII.GetString(b, 0, len);
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
