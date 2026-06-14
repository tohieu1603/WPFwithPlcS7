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
    [ObservableProperty] private string _status = "Ready";
    [ObservableProperty] private bool _dirty;

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
        Dirty = false;
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
        Dirty = false;
        Status = $"Downloaded to PLC at {System.DateTime.Now:HH:mm:ss}";
    }

    [RelayCommand]
    private void Reload()
    {
        _loaded = false;
        Dirty = false;
        Status = $"Reloaded from PLC at {System.DateTime.Now:HH:mm:ss}";
    }

    /// <summary>Load a built-in model preset into the editor (not yet downloaded).</summary>
    [RelayCommand]
    private void ApplyPreset(string model)
    {
        switch (model)
        {
            case "A": Set(1, 30, 1200, 2.5, 0.50, 0.10, 90, 2); break;
            case "B": Set(2, 28, 1500, 3.0, 0.60, 0.12, 92, 2); break;
            case "C": Set(3, 35, 900, 2.0, 0.45, 0.08, 88, 2); break;
        }
        Dirty = true;
        Status = $"Loaded preset MODEL-{model} — press DOWNLOAD to apply";
    }

    private void Set(int no, double cyc, double press, double torque, double gap, double tol, double score, int grade)
    {
        RecipeNumber = no; CycleTarget = cyc; PressForce = press; ScrewTorque = torque;
        GapNominal = gap; GapTol = tol; VisionMinScore = score; BarcodeMinGrade = grade;
    }

    partial void OnRecipeNumberChanged(int value) => Dirty = true;
    partial void OnCycleTargetChanged(double value) => Dirty = true;
    partial void OnPressForceChanged(double value) => Dirty = true;
    partial void OnScrewTorqueChanged(double value) => Dirty = true;
    partial void OnGapNominalChanged(double value) => Dirty = true;
    partial void OnGapTolChanged(double value) => Dirty = true;
    partial void OnVisionMinScoreChanged(double value) => Dirty = true;
    partial void OnBarcodeMinGradeChanged(int value) => Dirty = true;
}
