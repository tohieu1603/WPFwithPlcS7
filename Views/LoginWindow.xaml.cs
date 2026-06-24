using System.Windows;
using System.Windows.Controls;
using VisionHmi.ViewModels;

namespace VisionHmi.Views;

public partial class LoginWindow : Window
{
    private readonly LoginViewModel _vm;

    public LoginWindow(LoginViewModel vm)
    {
        InitializeComponent();
        DataContext = _vm = vm;
    }

    // PasswordBox.Password is not bindable (by design), so push it to the VM here.
    private void PwBox_Changed(object sender, RoutedEventArgs e) => _vm.Password = ((PasswordBox)sender).Password;
    private void ConfirmBox_Changed(object sender, RoutedEventArgs e) => _vm.Confirm = ((PasswordBox)sender).Password;
}
