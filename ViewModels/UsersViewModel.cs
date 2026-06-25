using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VisionHmi.Data;
using VisionHmi.Services;

namespace VisionHmi.ViewModels;

/// <summary>Admin "Users" screen: list all users and create / update / delete them.</summary>
public partial class UsersViewModel : ObservableObject
{
    private readonly UserService _users;

    public ObservableCollection<User> Items { get; } = [];
    public string[] Roles { get; } = ["Operator", "Admin"];

    [ObservableProperty] private User? _selected;
    [ObservableProperty] private string _username = "";
    [ObservableProperty] private string _fullName = "";
    [ObservableProperty] private string _password = "";
    [ObservableProperty] private string _role = "Operator";
    [ObservableProperty] private string _status = "";

    public UsersViewModel(UserService users)
    {
        _users = users;
        _ = Load();
    }

    [RelayCommand]
    private async Task Load()
    {
        Items.Clear();
        foreach (var u in await _users.GetAll()) Items.Add(u);
        Status = $"{Items.Count} người dùng";
    }

    // When a row is selected, copy it into the form (so Update/Delete work on it).
    partial void OnSelectedChanged(User? value)
    {
        if (value is null) return;
        Username = value.Username;
        FullName = value.FullName;
        Role = value.Role;
        Password = "";   // blank = keep current password on update
    }

    [RelayCommand]
    private async Task Create()
    {
        var (ok, err) = await _users.Create(Username.Trim(), FullName.Trim(), Password, Role);
        Status = ok ? "Đã thêm người dùng" : err;
        if (ok) { await Load(); NewForm(); }
    }

    [RelayCommand]
    private async Task Update()
    {
        if (Selected is null) { Status = "Chọn 1 người dùng để sửa"; return; }
        var (ok, err) = await _users.Update(Selected.Id, FullName.Trim(), Role,
            string.IsNullOrEmpty(Password) ? null : Password);
        Status = ok ? "Đã cập nhật" : err;
        if (ok) await Load();
    }

    [RelayCommand]
    private async Task Delete()
    {
        if (Selected is null) { Status = "Chọn 1 người dùng để xóa"; return; }
        var (ok, err) = await _users.Delete(Selected.Id);
        Status = ok ? "Đã xóa" : err;
        if (ok) { await Load(); NewForm(); }
    }

    [RelayCommand]
    private void NewForm()
    {
        Selected = null;
        Username = "";
        FullName = "";
        Password = "";
        Role = "Operator";
        Status = "Form trống — nhập rồi bấm Thêm";
    }
}
