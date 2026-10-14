import { Container } from "@/components/site/ui/Container";

export function NotFoundContent() {
  return <div className="pt-[var(--expanded-navbar-offset)]">
    <Container className="pt-10 pb-16 lg:pt-6">
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
    </Container>
  </div>;
}
