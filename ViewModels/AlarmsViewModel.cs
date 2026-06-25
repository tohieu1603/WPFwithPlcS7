using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Generated;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

public record AlarmRow(string Name, string Priority, string Station, string Description);
public record AlarmEvent(string Time, string Transition, string Priority, string Station, string Name, string Description);

/// <summary>Active alarms decoded from the PLC alarm words, plus a came/cleared event log
/// (ISA-18.2 style) and a per-priority summary.</summary>
public partial class AlarmsViewModel : LiveViewModel
{
    public ObservableCollection<AlarmRow> Active { get; } = [];
    public ObservableCollection<AlarmEvent> History { get; } = [];

    [ObservableProperty] private int _activeCount;
    [ObservableProperty] private int _criticalCount;
    [ObservableProperty] private int _highCount;
    [ObservableProperty] private int _mediumCount;
    [ObservableProperty] private int _lowCount;
    [ObservableProperty] private string _lastAck = "—";

    private int _lastWords = -1;
    private readonly HashSet<string> _prev = [];

    public AlarmsViewModel(PlcConnection plc) : base(plc) { }

    protected override void OnImage(PlcImage img)
    {
        int[] words = [img.Word(Tag.Alarm_Word0), img.Word(Tag.Alarm_Word1)];
        int combo = words[0] | (words[1] << 16);
        if (combo == _lastWords) return;
        _lastWords = combo;

        Active.Clear();
        int crit = 0, high = 0, med = 0, low = 0;
        var now = new HashSet<string>();
        foreach (var a in AlarmCatalog.All)
        {
            if ((words[a.Word] & (1 << a.Bit)) == 0) continue;
            Active.Add(new AlarmRow(a.Name, a.Priority, a.Station, a.Description));
            now.Add(a.Name);
            switch (a.Priority)
            {
                case "CRITICAL": crit++; break;
                case "HIGH": high++; break;
                case "MEDIUM": med++; break;
                default: low++; break;
            }
            if (!_prev.Contains(a.Name)) LogEvent("ALARM", a);
        }
        foreach (var a in AlarmCatalog.All)
            if (_prev.Contains(a.Name) && !now.Contains(a.Name)) LogEvent("CLEARED", a);

        _prev.Clear();
        foreach (var n in now) _prev.Add(n);

        ActiveCount = Active.Count;
        CriticalCount = crit; HighCount = high; MediumCount = med; LowCount = low;
    }

    private void LogEvent(string transition, AlarmDef a)
    {
        History.Insert(0, new AlarmEvent(DateTime.Now.ToString("HH:mm:ss"), transition,
            a.Priority, a.Station, a.Name, a.Description));
        while (History.Count > 100) History.RemoveAt(History.Count - 1);
    }

    [RelayCommand]
    private void Acknowledge()
    {
        Plc.Pulse(Tag.Cmd_AckAllAlarms);
        LastAck = DateTime.Now.ToString("HH:mm:ss");
    }
}
