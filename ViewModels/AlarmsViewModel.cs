using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Generated;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

public record AlarmRow(string Name, string Priority, string Station, string Description);

/// <summary>Active alarms, decoded from the PLC alarm words against the generated catalogue.</summary>
public partial class AlarmsViewModel : LiveViewModel
{
    public ObservableCollection<AlarmRow> Active { get; } = new();

    [ObservableProperty] private int _activeCount;
    private int _lastWords = -1;

    public AlarmsViewModel(PlcConnection plc) : base(plc) { }

    protected override void OnImage(PlcImage img)
    {
        int[] words = { img.Word(Tag.Alarm_Word0), img.Word(Tag.Alarm_Word1) };
        int combo = words[0] | (words[1] << 16);
        if (combo == _lastWords) return;
        _lastWords = combo;

        Active.Clear();
        foreach (var a in AlarmCatalog.All)
            if ((words[a.Word] & (1 << a.Bit)) != 0)
                Active.Add(new AlarmRow(a.Name, a.Priority, a.Station, a.Description));
        ActiveCount = Active.Count;
    }

    [RelayCommand] private void Acknowledge() => Plc.Pulse(Tag.Cmd_AckAllAlarms);
}
