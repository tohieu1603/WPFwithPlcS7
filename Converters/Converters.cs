using System.Collections.Generic;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace VisionHmi.Converters;

internal static class B
{
    public static Brush Make(string hex)
    {
        var b = new SolidColorBrush((Color)ColorConverter.ConvertFromString(hex)!);
        b.Freeze();
        return b;
    }
    public static readonly Brush Run = Make("#3FA34D");
    public static readonly Brush Fault = Make("#D14B4B");
    public static readonly Brush Warn = Make("#D7A23B");
    public static readonly Brush Idle = Make("#5A636B");
    public static readonly Brush Accent = Make("#4F7FB0");
    public static readonly Brush Orange = Make("#D7762B");
}

/// <summary>Station status string -> brush.</summary>
public class StatusToBrush : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c) => (v as string) switch
    { "RUN" => B.Run, "FAULT" => B.Fault, _ => B.Idle };
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>Bool -> Run/Idle (or Fault/Idle when parameter = "fault").</summary>
public class BoolToBrush : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c)
    {
        bool on = v is bool b && b;
        var onBrush = (p as string) == "fault" ? B.Fault : B.Run;
        return on ? onBrush : B.Idle;
    }
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>Alarm priority -> brush.</summary>
public class PriorityToBrush : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c) => (v as string) switch
    { "CRITICAL" => B.Fault, "HIGH" => B.Orange, "MEDIUM" => B.Warn, _ => B.Accent };
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>Disposition text -> brush (PASS green, FAIL red, else grey).</summary>
public class DispositionToBrush : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c) => (v as string) switch
    { "PASS" => B.Run, "FAIL" => B.Fault, "REWORK" => B.Warn, _ => B.Idle };
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>Bool -> "TrueText|FalseText".</summary>
public class BoolToText : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c)
    {
        var parts = (p as string ?? "ON|OFF").Split('|');
        return (v is bool b && b) ? parts[0] : (parts.Length > 1 ? parts[1] : "");
    }
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>int &gt; 0 -> Visible.</summary>
public class CountToVisibility : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c) =>
        v is int n && n > 0 ? Visibility.Visible : Visibility.Collapsed;
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>bool -> Visible/Collapsed (invert with parameter "invert").</summary>
public class BoolToVisibility : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c)
    {
        bool on = v is bool b && b;
        if ((p as string) == "invert") on = !on;
        return on ? Visibility.Visible : Visibility.Collapsed;
    }
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>PackML state text -> brush (running green, held amber, aborted/fault red).</summary>
public class StateToBrush : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c) => (v as string) switch
    {
        "EXECUTE" or "STARTING" or "COMPLETING" => B.Run,
        "HELD" or "HOLDING" or "UNHOLDING" or "SUSPENDED" or "SUSPENDING" => B.Warn,
        "ABORTED" or "ABORTING" or "CLEARING" => B.Fault,
        "STOPPED" or "STOPPING" or "RESETTING" => B.Idle,
        _ => B.Accent,
    };
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>Phase of a unit relative to the live part position: PASSED / ACTIVE / PENDING -> brush.</summary>
public class PhaseToBrush : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c) => (v as string) switch
    { "ACTIVE" => B.Accent, "PASSED" => B.Run, _ => B.Idle };
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>Station code (ST10..ST80) -> the matching equipment Geometry from app resources.</summary>
public class StationIconConverter : IValueConverter
{
    private static readonly Dictionary<string, string> Map = new()
    {
        ["ST10"] = "IconInfeed", ["ST20"] = "IconIdentify", ["ST30"] = "IconAssembly",
        ["ST40"] = "IconVision", ["ST50"] = "IconMarking", ["ST60"] = "IconVerify",
        ["ST70"] = "IconReject", ["ST80"] = "IconOutfeed",
    };
    public object? Convert(object v, Type t, object p, CultureInfo c) =>
        v is string code && Map.TryGetValue(code, out var key) ? Application.Current?.Resources[key] : null;
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}

/// <summary>Percentage (0..100) -> an arc Geometry for a circular gauge (clockwise from 12 o'clock).</summary>
public class RingGeometryConverter : IValueConverter
{
    public object Convert(object v, Type t, object p, CultureInfo c)
    {
        double pct = v switch { double d => d, int i => i, float f => f, _ => 0 };
        pct = Math.Max(0, Math.Min(100, pct));
        const double r = 52, cx = 60, cy = 60;
        double angle = pct / 100.0 * 359.999;
        double rad = angle * Math.PI / 180.0;
        var start = new Point(cx, cy - r);
        var end = new Point(cx + r * Math.Sin(rad), cy - r * Math.Cos(rad));
        var fig = new PathFigure { StartPoint = start, IsClosed = false };
        fig.Segments.Add(new ArcSegment(end, new Size(r, r), 0, angle > 180, SweepDirection.Clockwise, true));
        var geo = new PathGeometry();
        geo.Figures.Add(fig);
        geo.Freeze();
        return geo;
    }
    public object ConvertBack(object v, Type t, object p, CultureInfo c) => throw new NotSupportedException();
}
