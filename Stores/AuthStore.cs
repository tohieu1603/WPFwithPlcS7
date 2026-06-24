using System;
using VisionHmi.Data;

namespace VisionHmi.Stores;

/// <summary>Holds the currently signed-in user. Raising <see cref="CurrentUserChanged"/>
/// lets the app swap between the Login window and the main Shell (Navigator pattern).</summary>
public class AuthStore
{
    private User? _current;

    public User? CurrentUser
    {
        get => _current;
        set { _current = value; CurrentUserChanged?.Invoke(); }
    }

    public bool IsLoggedIn => _current != null;
    public bool IsAdmin => _current?.Role == "Admin";

    public event Action? CurrentUserChanged;

    public void Logout() => CurrentUser = null;
}
