import CardNav from '../CardNav';

export const Navbar = () => {
  const items = [
    {
      label: "About",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Company", ariaLabel: "About Company" },
        { label: "Careers", ariaLabel: "About Careers" }
      ]
    },
    {
      label: "Projects", 
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Featured", ariaLabel: "Featured Projects" },
        { label: "Case Studies", ariaLabel: "Project Case Studies" }
      ]
    },
    {
      label: "Contact",
      bgColor: "#271E37", 
      textColor: "#fff",
      links: [
        { label: "Email", ariaLabel: "Email us" },
        { label: "Login", ariaLabel: "Login" },
        { label: "Sign up", ariaLabel: "Sign up" }
      ]
    }
  ];

  return (
    <CardNav
      brandName="Voixly"
      items={items.map(section => ({
        ...section,
        links: section.links.map(link => ({
          ...link,
          href:
            link.label === "Login" ? "/login" : link.label === "Sign up" ? "/signup" : "#"
        }))
      }))}
      baseColor="var(--background)"
      menuColor="var(--foreground)"
      buttonBgColor="var(--primary)"
      buttonTextColor="var(--primary-foreground)"
      ease="power3.out"
    />
  );
};