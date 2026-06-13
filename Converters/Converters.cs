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
