import React from "react";
import {
  ROLE_PERMISSIONS_MAPPING,
  TRANSACTION_DISPLAY_NAMES,
  ACTION_DISPLAY_NAMES,
  PERMISSION_ICONS,
  hasPermission,
  isPermissionRestricted,
  getRolePermissions,
} from "@/lib/role-permissions-mapping";

type Role = keyof typeof ROLE_PERMISSIONS_MAPPING;

interface PermissionsTableProps {
  selectedRole: Role;
}

const PermissionsTable: React.FC<PermissionsTableProps> = ({
  selectedRole,
}) => {
  const rolePermissions = getRolePermissions(selectedRole);

  if (!rolePermissions) {
    return <div>No permissions found for this role</div>;
  }

  // Get role display name
  const getRoleDisplayName = (role: Role): string => {
    const roleNames = {
      biller: "Biller",
      biller_salesman: "Biller and Salesman",
      ca_accountant: "CA/Accountant",
      stock_keeper: "Stock Keeper",
      salesman: "Salesman",
      ca_account_edit: "CA/Accountant(Edit Access)",
      secondary_admin: "Secondary Admin",
    };
    return roleNames[role] || role;
  };

  // Get permission icon and color
  const getPermissionDisplay = (permission: string) => {
    switch (permission) {
      case "allowed":
        return { icon: "✓", color: "text-green-600", bgColor: "bg-green-50" };
      case "restricted":
        return { icon: "△", color: "text-yellow-600", bgColor: "bg-yellow-50" };
      case "not_applicable":
        return { icon: "✗", color: "text-red-600", bgColor: "bg-red-50" };
      default:
        return { icon: "NA", color: "text-gray-400", bgColor: "bg-gray-50" };
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {getRoleDisplayName(selectedRole)} Permissions
        </h3>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-200">
                Transactions
              </th>
              <th className="px-4 py-3 text-center font-medium text-blue-600 border-r border-gray-200 min-w-[80px]">
                VIEW
              </th>
              <th className="px-4 py-3 text-center font-medium text-blue-600 border-r border-gray-200 min-w-[80px]">
                CREATE
              </th>
              <th className="px-4 py-3 text-center font-medium text-blue-600 border-r border-gray-200 min-w-[80px]">
                EDIT
              </th>
              <th className="px-4 py-3 text-center font-medium text-blue-600 border-r border-gray-200 min-w-[80px]">
                SHARE
              </th>
              <th className="px-4 py-3 text-center font-medium text-blue-600 min-w-[80px]">
                DELETE
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {Object.entries(rolePermissions).map(
              ([transaction, permissions], index) => (
                <tr
                  key={transaction}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">
                    {TRANSACTION_DISPLAY_NAMES[
                      transaction as keyof typeof TRANSACTION_DISPLAY_NAMES
                    ] || transaction}
                  </td>

                  {/* VIEW */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    {(() => {
                      const display = getPermissionDisplay(permissions.view);
                      return (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${display.bgColor} ${display.color} font-medium text-sm`}
                          title={permissions.view}
                        >
                          {display.icon}
                        </span>
                      );
                    })()}
                  </td>

                  {/* CREATE */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    {(() => {
                      const display = getPermissionDisplay(permissions.create);
                      return (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${display.bgColor} ${display.color} font-medium text-sm`}
                          title={permissions.create}
                        >
                          {display.icon}
                        </span>
                      );
                    })()}
                  </td>

                  {/* EDIT */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    {(() => {
                      const display = getPermissionDisplay(permissions.edit);
                      return (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${display.bgColor} ${display.color} font-medium text-sm`}
                          title={permissions.edit}
                        >
                          {display.icon}
                        </span>
                      );
                    })()}
                  </td>

                  {/* SHARE */}
                  <td className="px-4 py-3 text-center border-r border-gray-200">
                    {(() => {
                      const display = getPermissionDisplay(permissions.share);
                      return (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${display.bgColor} ${display.color} font-medium text-sm`}
                          title={permissions.share}
                        >
                          {display.icon}
                        </span>
                      );
                    })()}
                  </td>

                  {/* DELETE */}
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const display = getPermissionDisplay(permissions.delete);
                      return (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${display.bgColor} ${display.color} font-medium text-sm`}
                          title={permissions.delete}
                        >
                          {display.icon}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 font-medium">
            ✓
          </span>
          <span className="text-gray-600">Allowed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-50 text-yellow-600 font-medium">
            △
          </span>
          <span className="text-gray-600">Restricted (Needs Approval)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-600 font-medium">
            ✗
          </span>
          <span className="text-gray-600">Not Allowed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 text-gray-400 font-medium text-xs">
            NA
          </span>
          <span className="text-gray-600">Not Applicable</span>
        </div>
      </div>
    </div>
  );
};

export default PermissionsTable;
