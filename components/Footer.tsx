import Link from "next/link";
import Image from "next/image";
import config from "@/config";

// Site footer. Support link is wired to config.resend.supportEmail; it only
// renders when an address is set.
const Footer = () => {
  return (
    <footer className="border-t border-base-300 bg-base-200">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/#" aria-current="page" className="flex items-center">
              <Image
                src="/streamline-logo.svg"
                alt={`${config.appName} logo`}
                priority={true}
                className="h-7 w-auto"
                width={185}
                height={28}
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-base-content/70">
              {config.appDescription}
            </p>
            <p className="mt-6 text-sm text-base-content/50">
              © {new Date().getFullYear()} {config.appName}. All rights reserved.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-base-content/50">
                Product
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li>
                  <Link href="/#features" className="text-base-content/70 transition-colors hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-base-content/70 transition-colors hover:text-primary">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="text-base-content/70 transition-colors hover:text-primary">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-base-content/50">
                Company
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li>
                  <Link href="/blog" className="text-base-content/70 transition-colors hover:text-primary">
                    Blog
                  </Link>
                </li>
                {config.resend.supportEmail && (
                  <li>
                    <a
                      href={`mailto:${config.resend.supportEmail}`}
                      className="text-base-content/70 transition-colors hover:text-primary"
                      aria-label="Contact support"
                    >
                      Support
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-base-content/50">
                Legal
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li>
                  <Link href="/tos" className="text-base-content/70 transition-colors hover:text-primary">
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-base-content/70 transition-colors hover:text-primary">
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
