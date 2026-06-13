using CommunityToolkit.Mvvm.ComponentModel;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

/// <summary>Base for screens that refresh from the PLC each scan.</summary>
public abstract class LiveViewModel : ObservableObject
{
    protected readonly PlcConnection Plc;

    protected LiveViewModel(PlcConnection plc)
    {
        Plc = plc;
        plc.Updated += OnImage;
    }

    protected abstract void OnImage(PlcImage img);
}
