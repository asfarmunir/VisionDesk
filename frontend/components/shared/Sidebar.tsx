"use client";
import Image from "next/image";
const Sidebar = () => {
  return (
    <div>
      <div className="bg-slate-200 flex h-screen antialiased text-slate-300 selection:bg-blue-600 selection:text-white">
        {/* SideBar */}
        <div
          id="menu"
          className="hidden md:block bg-gradient-to-l from-blue-900 to-blue-950  h-full   text-slate-300 w-80  overflow-y-scroll pb-8"
        >
          <div id="logo" className="mt-6 px-6">
            <h1 className="text-lg md:text-3xl font-bold border-b border-slate-500 pb-2 text-white mb-2">
              Sports Portal
            </h1>
            <p className="text-slate-300 text-sm">
              Manage your actions and activities
            </p>
          </div>
          <div
            id="profile"
            className="px-6 py-6 bg-indigo-950 mt-2 mb-4 mx-2 rounded-lg"
          >
            <p className="text-white">Welcome,</p>
            <div className="inline-flex w-full space-x-3 mt-2 items-center">
              <div className="w-full">
                <p className="flex items-center justify-between w-full">
                  <span className="text-sm md:text-base font-bold capitalize">
                    Asfar
                  </span>
                  {/* <Logout /> */}
                </p>

                <span className="text-xs  block text-slate-400 capitalize">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Movbile Sidebar */}
        <div className="flex md:hidden ">
          <input
            type="checkbox"
            id="drawer-toggle"
            className="relative sr-only peer"
            defaultChecked
          />
          <label
            htmlFor="drawer-toggle"
            className="absolute mt-[10%] opacity-80 left-2 inline-block p-4 transition-all duration-500 bg-blue-800 rounded-lg peer-checked:rotate-180 peer-checked:left-64"
          >
            <div className="w-5 h-1 mb-2 rotate-45 bg-white rounded-lg" />
            <div className="w-5 h-1 -rotate-45 bg-white rounded-lg" />
          </label>
          <div className=" fixed top-0  transition-all duration-500 transform -translate-x-full bg-white shadow-lg peer-checked:translate-x-0 bg-gradient-to-l from-blue-900 to-blue-950 min-h-screen  text-slate-300 w-64 z-30  left-0 h-screen overflow-y-scroll pb-8">
            <div id="logo" className="mt-6 px-6">
              <h1 className="text-lg md:text-3xl font-bold border-b border-slate-500 pb-2 text-white mb-2">
                Sports Portal
              </h1>
              <p className="text-slate-300 text-sm">
                Manage your actions and activities
              </p>
            </div>
            <div
              id="profile"
              className="px-6 py-6 bg-indigo-950 mt-2 mb-4 mx-2 rounded-lg"
            >
              <p className="text-white">Welcome,</p>
              <div className="inline-flex w-full space-x-3 mt-2 items-center">
                <span>
                  <Image
                    className="rounded-full w-10 h-8"
                    width={24}
                    height={24}
                    src={"/pp.png"}
                    alt=""
                  />
                </span>
                <div className="w-full">
                  <p className="flex items-center justify-between w-full">
                    <span className="text-sm md:text-base font-bold capitalize">
                      Asfar
                    </span>
                    {/* <Logout /> */}
                  </p>

                  <span className="text-xs  block text-slate-400 capitalize">
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Sidebar end */}
      </div>
    </div>
  );
};

export default Sidebar;
