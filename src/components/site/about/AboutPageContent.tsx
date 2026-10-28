/* eslint-disable @next/next/no-img-element -- Preserve original picture candidates, crops and native links. */
import { about, type AboutProfile } from "@/lib/content/about";
import { Container } from "@/components/site/ui/Container";
import { ProfileCarousel } from "./ProfileCarousel";

export function AboutPageContent({leadership=about.leadership}:{leadership?:{title:string;intro:string;people:readonly AboutProfile[];unavailable?:boolean}}) {
  return (
<article className="pb-24 lg:pb-32" data-about-page="">
        <Container className="pt-[84px] lg:pt-20">
            <header className="grid gap-y-7 lg:grid-cols-8 lg:gap-x-6 lg:gap-y-0 xl:grid-cols-12 xl:gap-x-8">
                <h1 className="font-heading text-[22px] leading-[30px] font-medium text-primary lg:col-span-2 lg:pt-[13px] xl:col-span-3 xl:pt-0 xl:text-2xl xl:leading-8">
                    {about.page_title}
                </h1>
                <p className="font-heading text-[36px] leading-[42px] font-semibold text-primary lg:col-start-3 lg:col-span-6 lg:text-[46px] lg:leading-[54px] xl:col-start-5 xl:col-span-8 xl:text-[56px] xl:leading-[64px]">
                    {about.intro.headline}
                </p>
            </header>

            <div className="mt-[38px] grid items-start gap-y-[34px] lg:mt-[74px] lg:grid-cols-8 lg:gap-x-6 lg:gap-y-0 xl:mt-16 xl:grid-cols-12 xl:gap-x-8">
                <picture className="block w-full lg:col-span-5 xl:col-span-8">
                    <source media="(min-width: 1280px)" srcSet={about.intro.image} />
                    <source media="(min-width: 1024px)" srcSet={about.intro.image_tablet} />
                    <img
                        src={about.intro.image_mobile}
                        alt={about.intro.image_alt}
                        width="370"
                        height="260"
                        fetchPriority="high"
                        className="h-[260px] w-full object-cover sm:h-[360px] xl:h-[400px]"
                     />
                </picture>

                <div className="lg:col-start-6 lg:col-span-3 xl:col-start-10">
                    <p className="text-[11px] leading-4 font-medium text-brand uppercase lg:text-xs lg:leading-[18px] xl:text-sm">
                        {about.intro.eyebrow}
                    </p>
                    <p className="mt-[18px] text-base leading-[25px] text-secondary lg:mt-5 lg:text-[17px] lg:leading-[26px] xl:mt-6 xl:text-lg xl:leading-7">
                        <span className="lg:hidden">{about.intro.description_mobile}</span>
                        <span className="hidden lg:inline xl:hidden">{about.intro.description_tablet}</span>
                        <span className="hidden xl:inline">{about.intro.description}</span>
                    </p>
                    <div className="mt-[51px] border-t border-line-mild pt-5 lg:mt-[37px] xl:mt-3 xl:pt-3">
                        <p className="text-[15px] leading-[22px] font-medium text-primary xl:text-base xl:leading-6">
                            <span className="xl:hidden">{about.intro.closing_statement_compact}</span>
                            <span className="hidden xl:inline">{about.intro.closing_statement}</span>
                        </p>
                    </div>
                </div>
            </div>

            <section id="mission" className="mt-[118px] scroll-mt-32 lg:mt-[156px] xl:mt-[120px]" aria-labelledby="mission-heading">
                <div className="grid gap-y-[108px] lg:grid-cols-8 lg:gap-x-6 lg:gap-y-0 xl:grid-cols-12 xl:gap-x-8">
                    <h2 id="mission-heading" className="font-heading text-[30px] leading-9 font-semibold text-primary lg:col-span-3 lg:max-w-[10rem] lg:text-[34px] lg:leading-[42px] xl:col-span-4 xl:text-[40px] xl:leading-[48px]">
                        {about.mission.title}
                    </h2>
                    <p className="font-heading text-xl leading-[30px] font-medium text-primary lg:col-start-4 lg:col-span-5 lg:text-2xl lg:leading-[34px] xl:col-start-5 xl:col-span-7 xl:text-[28px] xl:leading-10">
                        <span className="lg:hidden">{about.mission.statement_mobile}</span>
                        <span className="hidden lg:inline xl:hidden">{about.mission.statement_tablet}</span>
                        <span className="hidden xl:inline">{about.mission.statement}</span>
                    </p>
                </div>

                <ol className="mt-[87px] grid gap-y-[76px] lg:mt-[118px] lg:grid-cols-8 lg:gap-x-6 lg:gap-y-[60px] xl:mt-[120px] xl:grid-cols-12 xl:gap-x-8 xl:gap-y-0">
                    {about.mission.objectives.map((objective, index) => {
                        const last = index === about.mission.objectives.length - 1;
                        return <li key={objective.number} className={`grid grid-cols-[3rem_1fr] gap-x-4 border-t border-line-mild pt-5 lg:col-span-4 lg:grid-cols-[3.75rem_1fr] lg:gap-x-6 lg:pt-[21px] xl:col-span-4 xl:grid-cols-[5rem_1fr] xl:gap-x-8 xl:border-line-strong xl:pt-4 ${last ? "lg:col-span-8 xl:col-span-4" : ""}`}>
                            <span className="text-base leading-[22px] font-medium text-brand xl:text-lg xl:leading-6">{objective.number}</span>
                            <div className={last ? "lg:grid lg:grid-cols-[21.5625rem_1fr] lg:gap-x-[63px] xl:block" : undefined}>
                                <h3 className="font-heading text-lg leading-[25px] font-medium text-primary lg:leading-[26px] xl:text-xl xl:leading-7">{objective.title}</h3>
                                <p className={`mt-[11px] text-[15px] leading-[23px] text-secondary ${last ? "lg:mt-0" : "lg:mt-3"} xl:mt-4 xl:text-base xl:leading-6`}>
                                    <span className="lg:hidden">{objective.description_mobile}</span>
                                    <span className="hidden lg:inline">{objective.description}</span>
                                </p>
                            </div>
                        </li>;
                    })}
                </ol>
            </section>

            <blockquote className="mt-[110px] h-[390px] overflow-hidden bg-brand text-inverse lg:mt-[132px] lg:grid lg:h-[320px] lg:grid-cols-[1fr_18.5rem] xl:mt-[120px] xl:h-[330px] xl:grid-cols-[1fr_26rem]">
                <div className="px-6 pt-5 lg:grid lg:grid-cols-[3.5rem_1fr] lg:gap-x-6 lg:px-8 lg:pt-[18px] xl:grid-cols-[5rem_1fr] xl:gap-x-8 xl:pt-[22px]">
                    <span className="block font-heading text-[72px] leading-[72px] font-medium lg:text-[80px] lg:leading-[80px] xl:text-8xl xl:leading-[96px]" aria-hidden="true">&ldquo;</span>
                    <div className="mt-2 lg:mt-0 lg:pt-[42px] xl:pt-[38px]">
                        <p className="font-heading text-[28px] leading-9 font-medium lg:text-[34px] lg:leading-[44px] xl:text-[40px] xl:leading-[50px]">
                            {about.quote.text}
                        </p>
                        <cite className="mt-2 block text-sm leading-5 font-medium not-italic lg:mt-3 xl:mt-1">
                            <span aria-hidden="true">- </span><span className="italic">{about.quote.attribution}</span>
                        </cite>
                    </div>
                </div>
                <picture className="hidden h-full lg:block">
                    <source media="(min-width: 1280px)" srcSet={about.quote.image} />
                    <img
                        src={about.quote.image_tablet}
                        alt={about.quote.image_alt}
                        width="296"
                        height="320"
                        loading="lazy"
                        className="h-full w-full object-cover"
                     />
                </picture>
            </blockquote>

            <section className="mt-[184px] lg:mt-[61px] xl:mt-[120px]" aria-labelledby="story-heading">
                <h2 id="story-heading" className="font-heading text-[30px] leading-9 font-semibold text-primary lg:text-[40px] lg:leading-[48px]">
                    {about.story.title}
                </h2>
                <div className="mt-20 grid items-start gap-y-[68px] lg:mt-10 lg:grid-cols-8 lg:gap-x-6 lg:gap-y-0 xl:grid-cols-12 xl:gap-x-8">
                    <img
                        src={about.story.image}
                        alt={about.story.image_alt}
                        width="752"
                        height="500"
                        loading="lazy"
                        className="h-[300px] w-full object-cover lg:col-span-4 lg:h-[430px] xl:col-span-7 xl:h-[500px]"
                     />
                    <div className="lg:col-start-5 lg:col-span-4 xl:col-start-9">
                        <p className="font-heading text-2xl leading-[34px] font-medium text-primary">
                            {about.story.lead}
                        </p>
                        <p className="mt-[10px] text-base leading-[26px] text-secondary lg:mt-4">
                            {about.story.body}
                        </p>
                    </div>
                </div>
            </section>

            <ProfileCarousel leadership={leadership} />

            <section id="collaborations" className="mt-24 scroll-mt-32 border-t border-line-strong pt-8 xl:mt-36 xl:grid xl:grid-cols-12 xl:gap-x-8 xl:pt-10" aria-labelledby="collaboration-heading">
                <p className="text-sm leading-[18px] font-medium text-brand uppercase xl:col-span-3">
                    {about.collaboration.eyebrow}
                </p>
                <div className="mt-6 xl:col-start-5 xl:col-span-8 xl:mt-0">
                    <h2 id="collaboration-heading" className="font-heading text-[36px] leading-[44px] font-semibold text-primary xl:text-[40px] xl:leading-[48px]">
                        {about.collaboration.title}
                    </h2>
                    <p className="mt-6 max-w-2xl text-lg leading-7 text-secondary">
                        {about.collaboration.description}
                    </p>
                    <nav className="mt-8 flex flex-wrap gap-x-8 gap-y-4" aria-label="Collaboration actions">
                        {about.collaboration.actions.map(action => <a key={action.url} href={action.url} className="border-b border-line-strong pb-1 text-base leading-6 font-medium text-primary transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">{action.label}</a>)}
                    </nav>
                </div>
            </section>
        </Container>
    </article>
  );
}
