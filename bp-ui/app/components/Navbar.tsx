"use client";

import LocaleSwitcher from "./LocaleSwitcher";

export const Navbar = () => {
  return (
    <div className="navbar bg-base-100 px-4 shadow-sm">
      <div className="navbar-start">
        <a
          className="btn text-fear text text-2xl"
          style={{ fontFamily: "var(--font-bold)" }}
        >
          <span className="text-sm">LOGO</span>
        </a>
      </div>

      <div className="navbar-center">
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered w-[400px]"
        />
      </div>
      <div className="navbar-end flex items-center gap-2">
        <LocaleSwitcher />
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full"></div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content rounded-box bg-base-100 z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
