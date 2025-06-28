import React from 'react'
import { Outlet } from 'react-router';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import { MobileSidebar, NavItems, AuthGuard } from '../../../components';

const AdminLayout = () => {
    return (
        <AuthGuard requireAuth={true} requireAdmin={true}>
            <div className="admin-layout">
                <MobileSidebar />
                <aside className="w-full max-w-[270px] hidden lg:block">
                    <SidebarComponent width={270} enableGestures={false}>
                        <NavItems />
                    </SidebarComponent>
                </aside>
                <aside className="children">
                    <Outlet />
                </aside>
            </div>
        </AuthGuard>
    );
};

export default AdminLayout;