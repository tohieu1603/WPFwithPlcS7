using System.Windows;
using System.Windows.Media;

namespace VisionHmi.Controls;

/// <summary>
/// Lightweight 1D barcode renderer. Draws a deterministic Code-128-style bar pattern
/// derived from <see cref="Text"/> so the HMI can show "what was scanned" at the
/// Identify station. It is a faithful-looking representation, not a spec-encoded symbol.
/// </summary>
public sealed class BarcodeControl : FrameworkElement
{
    public static readonly DependencyProperty TextProperty = DependencyProperty.Register(
        nameof(Text), typeof(string), typeof(BarcodeControl),
        new FrameworkPropertyMetadata("", FrameworkPropertyMetadataOptions.AffectsRender));

    public static readonly DependencyProperty BarBrushProperty = DependencyProperty.Register(
        nameof(BarBrush), typeof(Brush), typeof(BarcodeControl),
        new FrameworkPropertyMetadata(Brushes.Black, FrameworkPropertyMetadataOptions.AffectsRender));

    public string Text
    {
        get => (string)GetValue(TextProperty);
        set => SetValue(TextProperty, value);
    }

    public Brush BarBrush
    {
        get => (Brush)GetValue(BarBrushProperty);
        set => SetValue(BarBrushProperty, value);
    }

    protected override void OnRender(DrawingContext dc)
    {
        double w = ActualWidth, h = ActualHeight;
        if (w <= 0 || h <= 0) return;

        string s = Text ?? "";
        if (s.Length == 0) return;

        // Build a list of module widths: (isBar, units). Guard-bar, data, guard-bar.
        var mods = new System.Collections.Generic.List<(bool bar, int units)>();
        void Add(bool bar, int units) => mods.Add((bar, units));

        Add(true, 2); Add(false, 1); Add(true, 1);            // start guard
        foreach (char ch in s)
        {
            int c = ch;
            Add(true, 1 + (c & 3));
            Add(false, 1 + ((c >> 2) & 3));
            Add(true, 1 + ((c >> 4) & 3));
            Add(false, 1 + ((c >> 6) & 3));
        }
        Add(true, 1); Add(false, 1); Add(true, 2);            // stop guard

        int totalUnits = 0;
        foreach (var m in mods) totalUnits += m.units;
        if (totalUnits == 0) return;

        double quiet = System.Math.Min(12, w * 0.05);
        double unit = (w - 2 * quiet) / totalUnits;
        if (unit <= 0) return;

        double x = quiet;
        foreach (var (bar, units) in mods)
        {
            double bw = units * unit;
            if (bar) dc.DrawRectangle(BarBrush, null, new Rect(x, 0, bw, h));
            x += bw;
        }
    }
}
