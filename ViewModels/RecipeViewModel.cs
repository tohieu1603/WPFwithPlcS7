using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Generated;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

/// <summary>Recipe screen: edit setpoints locally, Download writes them to DB12, with a
/// live read-back of what the PLC currently holds.</summary>
public partial class RecipeViewModel : LiveViewModel
{
    private bool _loaded;

    [ObservableProperty] private int _recipeNumber;
    [ObservableProperty] private double _cycleTarget;
    [ObservableProperty] private double _pressForce;
    [ObservableProperty] private double _screwTorque;
    [ObservableProperty] private double _gapNominal;
    [ObservableProperty] private double _gapTol;
    [ObservableProperty] private double _visionMinScore;
    [ObservableProperty] private int _barcodeMinGrade;

    [ObservableProperty] private double _activeGapNominal;
    [ObservableProperty] private double _activeVisionMinScore;

    public RecipeViewModel(PlcConnection plc) : base(plc) { }

    protected override void OnImage(PlcImage img)
    {
        ActiveGapNominal = img.Real(Tag.Gap_Nominal);
        ActiveVisionMinScore = img.Real(Tag.Vision_MinScore);
        if (_loaded) return;
        _loaded = true;
        RecipeNumber = img.Int(Tag.Recipe_Number);
        CycleTarget = img.Real(Tag.Cycle_Target);
        PressForce = img.Real(Tag.Press_Force_SP);
        ScrewTorque = img.Real(Tag.Screw_Torque_SP);
        GapNominal = img.Real(Tag.Gap_Nominal);
        GapTol = img.Real(Tag.Gap_Tol);
        VisionMinScore = img.Real(Tag.Vision_MinScore);
        BarcodeMinGrade = img.Int(Tag.Barcode_MinGrade);
    }

    [RelayCommand]
    private void Download()
    {
        Plc.WriteInt(Tag.Recipe_Number, (short)RecipeNumber);
        Plc.WriteReal(Tag.Cycle_Target, (float)CycleTarget);
        Plc.WriteReal(Tag.Press_Force_SP, (float)PressForce);
        Plc.WriteReal(Tag.Screw_Torque_SP, (float)ScrewTorque);
        Plc.WriteReal(Tag.Gap_Nominal, (float)GapNominal);
        Plc.WriteReal(Tag.Gap_Tol, (float)GapTol);
        Plc.WriteReal(Tag.Vision_MinScore, (float)VisionMinScore);
        Plc.WriteInt(Tag.Barcode_MinGrade, (short)BarcodeMinGrade);
    }

    [RelayCommand] private void Reload() => _loaded = false;
}
