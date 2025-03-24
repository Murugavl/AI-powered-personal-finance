import React from "react";
import Image from "next/image";
import background from "../../public/images/login-bg.png"

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full p-0 m-0">
      <div>
        {children}
      </div>
    </div>
  );
};

export default layout;
