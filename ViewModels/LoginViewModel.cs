using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Services;

namespace VisionHmi.ViewModels;

/// <summary>Login + register form (one screen, toggled by <see cref="IsRegister"/>).
/// On success the user is published to the AuthStore, which makes the app open the Shell.</summary>
public partial class LoginViewModel : ObservableObject
{
    private readonly AuthService _auth;

    [ObservableProperty] private string _username = "";
    [ObservableProperty] private string _password = "";
    [ObservableProperty] private string _confirm = "";
    [ObservableProperty] private string _fullName = "";
    [ObservableProperty] private string _error = "";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(NotBusy))]
    private bool _busy;

    public bool NotBusy => !Busy;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(Title))]
    [NotifyPropertyChangedFor(nameof(SubmitText))]
    [NotifyPropertyChangedFor(nameof(ToggleText))]
    private bool _isRegister;

    public string Title => IsRegister ? "Đăng ký tài khoản" : "Đăng nhập";
    public string SubmitText => IsRegister ? "Đăng ký" : "Đăng nhập";
    public string ToggleText => IsRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký";

    public LoginViewModel(AuthService auth) => _auth = auth;

    [RelayCommand]
    private async Task Submit()
    {
        Error = "";
        Busy = true;
        try
        {
            if (IsRegister)
            {
                if (Password != Confirm) { Error = "Mật khẩu nhập lại không khớp"; return; }
                var (ok, err) = await _auth.Register(Username.Trim(), FullName.Trim(), Password);
                if (!ok) { Error = err; return; }
                // auto sign-in right after a successful registration
                var (lok, lerr) = await _auth.Login(Username.Trim(), Password);
                if (!lok) Error = lerr;
            }
            else
            {
                var (ok, err) = await _auth.Login(Username.Trim(), Password);
                if (!ok) Error = err;
            }
        }
        catch (System.Exception ex)
        {
            Error = "Lỗi kết nối CSDL: " + ex.Message;
        }
        finally
        {
            Busy = false;
        }
    }

    [RelayCommand]
    private void ToggleMode()
    {
        IsRegister = !IsRegister;
        Error = "";
        Password = "";
        Confirm = "";
    }
}
