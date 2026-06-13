using System.Windows;
using VisionHmi.ViewModels;

namespace VisionHmi.Views;

public partial class ShellWindow : Window
{
    public ShellWindow(ShellViewModel vm)
    {
        InitializeComponent();
        DataContext = vm;
        Loaded += (_, _) => vm.Start();
    }
}
