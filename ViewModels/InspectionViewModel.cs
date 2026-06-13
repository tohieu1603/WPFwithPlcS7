using CommunityToolkit.Mvvm.ComponentModel;
using VisionHmi.Generated;
using VisionHmi.Plc;

namespace VisionHmi.ViewModels;

/// <summary>Live inspection screen: barcode identify, vision result, mark &amp; verify,
/// plus the current unit's traceability fields.</summary>
public partial class InspectionViewModel : LiveViewModel
{
    private static readonly string[] Grades = { "F", "D", "C", "B", "A", "A+" };
    private static readonly string[] Disp = { "IN-PROCESS", "PASS", "FAIL", "REWORK" };

    // Barcode (ST20)
    [ObservableProperty] private bool _bcrReadOk;
    [ObservableProperty] private bool _bcrNoRead;
    [ObservableProperty] private string _bcrData = "";
    [ObservableProperty] private string _bcrGrade = "—";

    // Vision (ST40)
    [ObservableProperty] private bool _visPass;
    [ObservableProperty] private bool _visFail;
    [ObservableProperty] private bool _visReady;
    [ObservableProperty] private double _visScore;
    [ObservableProperty] private double _visMeasure1;
    [ObservableProperty] private double _visMeasure2;
    [ObservableProperty] private int _visResultCode;

    // Marking + verify
    [ObservableProperty] private string _markedSerial = "";
    [ObservableProperty] private bool _verifyMatch;
    [ObservableProperty] private string _verifyGrade = "—";

    // Current unit
    [ObservableProperty] private string _curSerial = "";
    [ObservableProperty] private string _curProduct = "";
    [ObservableProperty] private string _dispositionText = "—";

    // Reject breakdown
    [ObservableProperty] private int _rejVision;
    [ObservableProperty] private int _rejBarcode;
    [ObservableProperty] private int _rejVerify;
    [ObservableProperty] private int _rejAssembly;

    public InspectionViewModel(PlcConnection plc) : base(plc) { }

    protected override void OnImage(PlcImage img)
    {
        BcrReadOk = img.Bool(Tag.BCR_ReadOK);
        BcrNoRead = img.Bool(Tag.BCR_NoRead);
        BcrData = img.Str(Tag.BCR_Data);
        BcrGrade = GradeText(img.Int(Tag.BCR_Grade));

        VisReady = img.Bool(Tag.VIS_ResultReady);
        VisPass = img.Bool(Tag.VIS_Pass);
        VisFail = img.Bool(Tag.VIS_Fail);
        VisScore = img.Real(Tag.VIS_MatchScore);
        VisMeasure1 = img.Real(Tag.VIS_Measure1);
        VisMeasure2 = img.Real(Tag.VIS_Measure2);
        VisResultCode = img.Int(Tag.VIS_ResultCode);

        MarkedSerial = img.Str(Tag.MRK_Serial);
        VerifyMatch = img.Bool(Tag.VFY_Match);
        VerifyGrade = GradeText(img.Int(Tag.VFY_Grade));

        CurSerial = img.Str(Tag.Cur_Serial);
        CurProduct = img.Str(Tag.Cur_ProductId);
        int d = img.Int(Tag.Cur_Disposition);
        DispositionText = d >= 0 && d < Disp.Length ? Disp[d] : "—";

        RejVision = img.DInt(Tag.Rej_Vision);
        RejBarcode = img.DInt(Tag.Rej_Barcode);
        RejVerify = img.DInt(Tag.Rej_Verify);
        RejAssembly = img.DInt(Tag.Rej_Assembly);
    }

    private static string GradeText(int g) => g >= 0 && g < Grades.Length ? Grades[g] : "—";
}
