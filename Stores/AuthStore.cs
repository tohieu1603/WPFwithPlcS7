using System;
using VisionHmi.Data;

namespace VisionHmi.Stores;

/// <summary>Holds the currently signed-in user. Raising <see cref="CurrentUserChanged"/>
/// lets the app swap between the Login window and the main Shell (Navigator pattern).</summary>
public class AuthStore
{
    public User? CurrentUser
    {
        get;
        set { field = value; CurrentUserChanged?.Invoke(); }
    }

    public bool IsLoggedIn => CurrentUser != null;
    public bool IsAdmin => CurrentUser?.Role == "Admin";

    public event Action? CurrentUserChanged;

    public void Logout() => CurrentUser = null;
}
