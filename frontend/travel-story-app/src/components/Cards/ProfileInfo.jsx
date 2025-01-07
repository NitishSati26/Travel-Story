import React from "react";
import { getInitials } from "../../utils/helper";

const ProfileInfo = ({ userInfo, onLogout }) => {
  return (
    userInfo && (
      <div className="flex items-center gap-3">
        {/* Display user's initials */}
        <div className="w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100">
          {/* {userInfo?.fullName?.charAt(0) || ""} */}
          {getInitials(userInfo?.fullName || "")}
        </div>
        <div>
          <p className="text-sm font-medium">{userInfo?.fullName || "Guest"}</p>
          <button className="text-blue-700 text-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    )
  );
};

export default ProfileInfo;
