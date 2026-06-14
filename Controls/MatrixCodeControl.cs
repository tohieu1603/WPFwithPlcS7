using System.Windows;
using System.Windows.Media;

namespace VisionHmi.Controls;

/// <summary>
/// 2D data-matrix / QR-style renderer. Fills a 21x21 module grid deterministically from
/// <see cref="Text"/> (with the three corner finder patterns) so the HMI can show the 2D
/// mark applied at the Marking station. Representation only, not a spec-encoded symbol.
/// </summary>
public sealed class MatrixCodeControl : FrameworkElement
{
    private const int N = 21;     // QR version-1 module count

    public static readonly DependencyProperty TextProperty = DependencyProperty.Register(
        nameof(Text), typeof(string), typeof(MatrixCodeControl),
        new FrameworkPropertyMetadata("", FrameworkPropertyMetadataOptions.AffectsRender));

    public static readonly DependencyProperty ModuleBrushProperty = DependencyProperty.Register(
        nameof(ModuleBrush), typeof(Brush), typeof(MatrixCodeControl),
        new FrameworkPropertyMetadata(Brushes.Black, FrameworkPropertyMetadataOptions.AffectsRender));

    public string Text
    {
        get => (string)GetValue(TextProperty);
        set => SetValue(TextProperty, value);
    }

    public Brush ModuleBrush
    {
        get => (Brush)GetValue(ModuleBrushProperty);
        set => SetValue(ModuleBrushProperty, value);
    }

    protected override void OnRender(DrawingContext dc)
    {
        double w = ActualWidth, h = ActualHeight;
        if (w <= 0 || h <= 0) return;

        string s = Text ?? "";
        if (s.Length == 0) return;

        var on = new bool[N, N];

        // Three finder patterns (7x7) at top-left, top-right, bottom-left.
        void Finder(int r0, int c0)
        {
            for (int r = 0; r < 7; r++)
                for (int c = 0; c < 7; c++)
                {
                    bool border = r == 0 || r == 6 || c == 0 || c == 6;
                    bool core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                    on[r0 + r, c0 + c] = border || core;
                }
        }
        Finder(0, 0); Finder(0, N - 7); Finder(N - 7, 0);

        bool InFinder(int r, int c) =>
            (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);

        // Deterministic fill from a string-seeded LCG.
        uint seed = 2166136261;
        foreach (char ch in s) { seed ^= ch; seed *= 16777619; }
        uint Next() { seed = seed * 1664525 + 1013904223; return seed; }

        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++)
                if (!InFinder(r, c))
                    on[r, c] = (Next() & 7) < 3;   // ~37% density

        double side = System.Math.Min(w, h);
        double unit = side / (N + 2);              // 1-module quiet zone each side
        double ox = (w - side) / 2 + unit;
        double oy = (h - side) / 2 + unit;

        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++)
                if (on[r, c])
                    dc.DrawRectangle(ModuleBrush, null,
                        new Rect(ox + c * unit, oy + r * unit, unit + 0.5, unit + 0.5));
    }
}
