import {Link, NavLink, useLoaderData, useNavigate} from "react-router";
import {sidebarItems} from "~/constants";
import {cn} from "lib/utils";
import {logoutUser} from "~/appwrite/auth";

const NavItems = ({ handleClick }: { handleClick?: () => void}) => {
    const user = useLoaderData()as {
        name: string;
        email: string;
        imageUrl?: string;
    };
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/sign-in')
    }

    return (
        <section className="nav-items">
            <Link to='./dashboard' className="link-logo">
                <img src="/assets/icons/logo.svg" alt="logo" className="size-[30px]" />
                <h1>Study Sync</h1>
            </Link>

            <div className="container">
                <nav>
                    {sidebarItems.map(({ id, href, icon, label }) => (
                        <NavLink to={href} key={id}>
                            {({ isActive }: { isActive: boolean }) => (
                                <div className={cn('group nav-item', {
                                    'active': isActive
                                })} onClick={handleClick}>
                                    <img
                                        src={icon}
                                        alt={label}
                                        className={`size-5 transition-all duration-200 ${isActive ? 'brightness-0 invert' : 'group-hover:brightness-0 group-hover:invert'}`}
                                    />
                                    <span className="relative z-10">{label}</span>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <footer className="nav-footer mb-4">
                    <img src={user?.imageUrl || '/assets/images/david.webp'} alt={user?.name || 'David'} />

                    <article>
                        <h2>{user?.name || 'Animesh'}</h2>
                        <p>{user?.email || 'animeshkumarbiswas3@gmail.com'}</p>
                    </article>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm border border-transparent hover:border-red-200/50 cursor-pointer group"
                    >
                        <img
                            src="/assets/icons/logout.svg"
                            alt="logout"
                            className="size-5 transition-all duration-200 group-hover:brightness-0 group-hover:invert"
                        />
                    </button>
                </footer>
            </div>
        </section>
    )
}

export default NavItems