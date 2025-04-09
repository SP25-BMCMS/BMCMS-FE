import MaterialManagement from "@/pages/MaterialManagement"
import MaterialDetail from "@/pages/MaterialDetail"

const AppRoutes = () => {
    return (
        <Routes>
            <Route
                path="/materials"
                element={
                    <RoleBasedRoute allowedRoles={["Manager"]}>
                        <MaterialManagement />
                    </RoleBasedRoute>
                }
            />
            <Route
                path="/materials/:materialId"
                element={
                    <RoleBasedRoute allowedRoles={["Manager"]}>
                        <MaterialDetail />
                    </RoleBasedRoute>
                }
            />
        </Routes>
    )
}

export default AppRoutes 