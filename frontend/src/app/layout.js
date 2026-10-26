import "./globals.css";
import PropTypes from "prop-types";
import { Open_Sans } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { getAuth } from "@/auth";
import AuthTokenRefresher from "@/components/AuthTokenRefresher";
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Network Traffic Analysis",
  description: "Professional traffic analysis platform",
};

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default async function RootLayout({ children }) {
  const session = await getAuth();

  return (
    <html lang="en">
      <body
        className={`${openSans.className} antialiased min-h-screen flex flex-col bg-gray-50 text-gray-900`}
      >
        <AuthTokenRefresher active={Boolean(session)} />
        {session && <Navbar user={session.user} />}

        <main className="flex-1 w-full px-4  sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
