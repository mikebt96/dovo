"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import LanguageToggle from "./LanguageToggle";
import "./landing.css";

/* dovo landing — "Ultraviolet". Ported from prototypes/solar.html.
   Hero is video-driven: an abstract Ultraviolet loop as full-bleed background
   + a documentary duo loop in the portrait zone. Both pause under
   prefers-reduced-motion (first frame acts as poster).
   Copy is bilingual via next-intl. */
export default function Landing() {
  const t = useTranslations("landing");
  const rootRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLVideoElement>(null);
  const duoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Renders a "\n"-delimited message as <br>-separated lines (for big titles).
  const renderLines = (key: string) =>
    t(key)
      .split("\n")
      .map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // ---- Live clock (the "instrument/telemetry" tell) ----
    const tickClock = () => {
      const el = clockRef.current;
      if (!el) return;
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      el.textContent = `TRAINING TIME — ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    };
    tickClock();
    const clockTimer = window.setInterval(tickClock, 1000);

    // ---- Scroll reveal ----
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-in");
      },
      { threshold: 0.1 }
    );
    root.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- Hero videos + parallax (only when motion is allowed; under
    //      reduced-motion the videos hold their first frame as a poster) ----
    let raf = 0;
    let cleanupListeners: (() => void) | undefined;

    if (!reduced) {
      for (const v of [ambientRef.current, duoRef.current]) {
        v?.play().catch(() => {});
      }

      // ---- Parallax engine (archar-style layered depth) ----
      const pxEls: { el: HTMLElement; speed: number }[] = [
        ...Array.from(root.querySelectorAll<HTMLElement>("[data-px]")).map((el) => ({
          el,
          speed: parseFloat(el.dataset.px || "0"),
        })),
        ...Array.from(root.querySelectorAll<HTMLElement>(".section-title")).map((el) => ({
          el,
          speed: 0.06,
        })),
      ];
      let targetScroll = window.scrollY;
      let lastScroll = targetScroll;
      const onScroll = () => {
        targetScroll = window.scrollY;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanupListeners = () => window.removeEventListener("scroll", onScroll);

      const loop = () => {
        lastScroll += (targetScroll - lastScroll) * 0.08;
        const vh2 = window.innerHeight / 2;

        const stage = stageRef.current;
        if (stage) {
          const r = stage.getBoundingClientRect();
          const center = r.top + r.height / 2 - vh2;
          stage.style.transform = `perspective(1400px) rotateX(${(center * -0.004).toFixed(
            2
          )}deg) translateY(${(center * -0.03).toFixed(1)}px)`;
        }

        for (const { el, speed } of pxEls) {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
          const center = r.top + r.height / 2 - vh2;
          el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.clearInterval(clockTimer);
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      cleanupListeners?.();
    };
  }, []);

  return (
    <div className="dv-landing" ref={rootRef}>
      <div className="grain" />

      <nav className="nav">
        <div className="brand">
          <Link href="/" className="nav-wordmark" aria-label="dovo — inicio">
            dovo
          </Link>
          <div className="clock" ref={clockRef}>
            TRAINING TIME — --:--:--
          </div>
        </div>
        <div className="links">
          <a href="#how">{t("nav.how")}</a>
          <a href="#system">{t("nav.system")}</a>
          <a href="#stories">{t("nav.stories")}</a>
          <a href="#pricing">{t("nav.pricing")}</a>
          <Link href="/sign-in">{t("nav.signIn")}</Link>
        </div>
        <div className="nav-actions">
          <LanguageToggle />
          <Link href="/sign-up" className="pill">
            {t("nav.cta")}
          </Link>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero" id="hero">
          <video
            ref={ambientRef}
            className="hero-bg"
            src="/hero/ambient.mp4"
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="portrait" data-px="0.14">
            <video
              ref={duoRef}
              className="portrait-video"
              src="/hero/duo.mp4"
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            />
            <div className="portrait-veil" />
          </div>
          <div className="inner">
            <div className="labels">
              <div className="l">{t("hero.label1")}</div>
              <div className="l">
                {t.rich("hero.label2", {
                  star: (chunks) => <span className="star">{chunks}</span>,
                })}
              </div>
            </div>
            <div>
              <h1>
                <span className="reveal">
                  <span>{t("hero.h1a")}</span>
                </span>
                <span className="reveal">
                  <span>
                    {t("hero.h1b")}
                    <span className="dot-end">.</span>
                  </span>
                </span>
              </h1>
              <div className="cta-row">
                <Link href="/sign-up" className="btn-dark">
                  {t("hero.ctaPrimary")} <span className="arrow">→</span>
                </Link>
                <a href="#how" className="btn-ghost">
                  {t("hero.ctaSecondary")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STATEMENT */}
        <section className="statement reveal-on-scroll">
          <h2>
            {t("statement.title")}
            <span className="dot" />
          </h2>
          <p>{t("statement.body")}</p>
        </section>

        {/* RENDER SHOWCASE */}
        <section className="render reveal-on-scroll">
          <div className="stage" ref={stageRef}>
            <div className="float-card">
              <div className="fc-top">
                <span>dovo</span>
                <span className="tier">{t("render.tier")}</span>
              </div>
              <div className="fc-stats">
                <div className="s">
                  FUE<b>62</b>
                </div>
                <div className="s">
                  RES<b>88</b>
                </div>
                <div className="s">
                  FLEX<b>41</b>
                </div>
              </div>
              <div className="fc-class">
                The <span>Athlete</span>
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="process reveal-on-scroll" id="how">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{renderLines("process.title")}</h2>
              <p className="section-desc">{t("process.desc")}</p>
            </div>
            <div className="step">
              <div className="num">01</div>
              <div className="body">
                <h3>{t("process.s1Title")}</h3>
                <p>{t("process.s1Body")}</p>
              </div>
              <div className="tag">{t("process.s1Tag")}</div>
            </div>
            <div className="step">
              <div className="num">02</div>
              <div className="body">
                <h3>{t("process.s2Title")}</h3>
                <p>{t("process.s2Body")}</p>
              </div>
              <div className="tag">{t("process.s2Tag")}</div>
            </div>
            <div className="step">
              <div className="num">03</div>
              <div className="body">
                <h3>{t("process.s3Title")}</h3>
                <p>{t("process.s3Body")}</p>
              </div>
              <div className="tag">{t("process.s3Tag")}</div>
            </div>
            <div className="step">
              <div className="num">04</div>
              <div className="body">
                <h3>{t("process.s4Title")}</h3>
                <p>{t("process.s4Body")}</p>
              </div>
              <div className="tag">{t("process.s4Tag")}</div>
            </div>
          </div>
        </section>

        {/* STORIES */}
        <section className="stories reveal-on-scroll" id="stories">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{renderLines("stories.title")}</h2>
              <p className="section-desc">{t("stories.desc")}</p>
            </div>
            <div className="cards">
              <article className="card">
                <div
                  className="cover"
                  style={{ background: "linear-gradient(160deg, #8b6dff, #6d4aff)" }}
                >
                  <img className="cover-img" src="/stories/c1-pilates.webp" alt="" loading="lazy" />
                  <span className="ph">{t("stories.c1Sport")}</span>
                </div>
                <div className="meta">
                  <div>
                    <div className="n">Lía &amp; Bruno</div>
                    <div className="sub">{t("stories.c1Quote")}</div>
                  </div>
                  <div className="wk">14 {t("stories.wk")}</div>
                </div>
              </article>
              <article className="card">
                <div
                  className="cover"
                  style={{ background: "linear-gradient(160deg, #0d0b1a, #1f1b38)" }}
                >
                  <img className="cover-img" src="/stories/c2-run.webp" alt="" loading="lazy" />
                  <span className="ph">{t("stories.c2Sport")}</span>
                </div>
                <div className="meta">
                  <div>
                    <div className="n">Hana &amp; Sora</div>
                    <div className="sub">{t("stories.c2Quote")}</div>
                  </div>
                  <div className="wk">22 {t("stories.wk")}</div>
                </div>
              </article>
              <article className="card">
                <div
                  className="cover"
                  style={{ background: "linear-gradient(160deg, #3ac4d6, #2a7a96)" }}
                >
                  <img className="cover-img" src="/stories/c3-pool.webp" alt="" loading="lazy" />
                  <span className="ph">{t("stories.c3Sport")}</span>
                </div>
                <div className="meta">
                  <div>
                    <div className="n">Mateo &amp; Camila</div>
                    <div className="sub">{t("stories.c3Quote")}</div>
                  </div>
                  <div className="wk">9 {t("stories.wk")}</div>
                </div>
              </article>
              <article className="card">
                <div
                  className="cover"
                  style={{ background: "linear-gradient(160deg, #aef03c, #6b9620)" }}
                >
                  <img className="cover-img" src="/stories/c4-ballet.webp" alt="" loading="lazy" />
                  <span className="ph">{t("stories.c4Sport")}</span>
                </div>
                <div className="meta">
                  <div>
                    <div className="n">Aiko &amp; Ren</div>
                    <div className="sub">{t("stories.c4Quote")}</div>
                  </div>
                  <div className="wk">30 {t("stories.wk")}</div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SYSTEM */}
        <section className="system reveal-on-scroll" id="system">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{renderLines("system.title")}</h2>
              <p className="section-desc">{t("system.desc")}</p>
            </div>
            <div className="grid">
              <div className="cell">
                <div className="num">{t("system.c1Num")}</div>
                <h3>{t("system.c1Title")}</h3>
                <p>{t("system.c1Body")}</p>
              </div>
              <div className="cell">
                <div className="num">{t("system.c2Num")}</div>
                <h3>{t("system.c2Title")}</h3>
                <p>{t("system.c2Body")}</p>
              </div>
              <div className="cell">
                <div className="num">{t("system.c3Num")}</div>
                <h3>{t("system.c3Title")}</h3>
                <p>{t("system.c3Body")}</p>
              </div>
              <div className="cell">
                <div className="num">{t("system.c4Num")}</div>
                <h3>{t("system.c4Title")}</h3>
                <p>{t("system.c4Body")}</p>
              </div>
              <div className="cell">
                <div className="num">{t("system.c5Num")}</div>
                <h3>{t("system.c5Title")}</h3>
                <p>{t("system.c5Body")}</p>
              </div>
              <div className="cell">
                <div className="num">{t("system.c6Num")}</div>
                <h3>{t("system.c6Title")}</h3>
                <p>{t("system.c6Body")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing reveal-on-scroll" id="pricing">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{renderLines("pricing.title")}</h2>
              <p className="section-desc">{t("pricing.desc")}</p>
            </div>
            <div className="grid">
              <div className="tier">
                <div className="tag">&nbsp;</div>
                <h3>{t("pricing.freeName")}</h3>
                <div className="price">{t("pricing.freePrice")}</div>
                <div className="period">{t("pricing.freePeriod")}</div>
                <ul>
                  <li>{t("pricing.freeF1")}</li>
                  <li>{t("pricing.freeF2")}</li>
                  <li>{t("pricing.freeF3")}</li>
                  <li>{t("pricing.freeF4")}</li>
                  <li>{t("pricing.freeF5")}</li>
                  <li>{t("pricing.freeF6")}</li>
                </ul>
                <Link href="/sign-up" className="cta-tier">
                  {t("pricing.freeCta")}
                </Link>
              </div>
              <div className="tier featured">
                <div className="tag">{t("pricing.proTag")}</div>
                <h3>{t("pricing.proName")}</h3>
                <div className="price">
                  {t("pricing.proPrice")}
                  <span className="cents">.99</span>
                </div>
                <div className="period">{t("pricing.proPeriod")}</div>
                <ul>
                  <li>{t("pricing.proF1")}</li>
                  <li>{t("pricing.proF2")}</li>
                  <li>{t("pricing.proF3")}</li>
                  <li>{t("pricing.proF4")}</li>
                  <li>{t("pricing.proF5")}</li>
                  <li>{t("pricing.proF6")}</li>
                </ul>
                <Link href="/sign-up" className="cta-tier">
                  {t("pricing.proCta")}
                </Link>
              </div>
              <div className="tier">
                <div className="tag">{t("pricing.premiumTag")}</div>
                <h3>{t("pricing.premiumName")}</h3>
                <div className="price">
                  {t("pricing.premiumPrice")}
                  <span className="cents">.99</span>
                </div>
                <div className="period">{t("pricing.premiumPeriod")}</div>
                <ul>
                  <li>{t("pricing.premiumF1")}</li>
                  <li>{t("pricing.premiumF2")}</li>
                  <li>{t("pricing.premiumF3")}</li>
                  <li>{t("pricing.premiumF4")}</li>
                  <li>{t("pricing.premiumF5")}</li>
                </ul>
                <Link href="/sign-up" className="cta-tier">
                  {t("pricing.premiumCta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SHARE (dark accent section) */}
        <section className="share reveal-on-scroll" id="share">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{t("share.title")}</h2>
              <p className="section-desc">{t("share.desc")}</p>
            </div>
            <div className="share-block">
              <div className="copy">
                <h3>
                  {t.rich("share.h3", {
                    em: (chunks) => <em>{chunks}</em>,
                    br: () => <br />,
                  })}
                </h3>
                <p>{t("share.body")}</p>
                <div className="share-platforms">
                  <span className="platform">Instagram</span>
                  <span className="platform">TikTok</span>
                  <span className="platform">X</span>
                  <span className="platform">Strava</span>
                  <span className="platform">{t("share.platformMore")}</span>
                </div>
              </div>
              <div className="share-mock">
                <div className="smk-top">
                  <div className="smk-wordmark">dovo</div>
                  <div className="smk-tag">{t("share.mockTag")}</div>
                </div>
                <div>
                  <div className="smk-stat-value">+12</div>
                  <div className="smk-stat-label">{t("share.mockLabel")}</div>
                </div>
                <div className="smk-footer">
                  <div className="pair">
                    <span>{t("share.mockClass")}</span>
                    <span>Athlete</span>
                  </div>
                  <div className="pair">
                    <span>{t("share.mockStreak")}</span>
                    <span>22 {t("stories.wk")}</span>
                  </div>
                  <div className="pair">
                    <span>{t("share.mockTop")}</span>
                    <span>RES 88</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL */}
        <section className="final reveal-on-scroll">
          <h2>
            {t.rich("final.h2", {
              em: (chunks) => <em>{chunks}</em>,
              br: () => <br />,
            })}
          </h2>
          <p>{t("final.body")}</p>
          <div className="cta-row">
            <Link href="/sign-up" className="btn-dark">
              {t("final.ctaPrimary")} <span className="arrow">→</span>
            </Link>
            <a href="#how" className="btn-ghost">
              {t("final.ctaSecondary")}
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="left">
            <div className="wordmark">dovo</div>
            <p>{t("footer.tagline")}</p>
          </div>
          <div className="right">
            <div className="col">
              <h4>{t("footer.product")}</h4>
              <ul>
                <li>
                  <a href="#how">{t("footer.howItWorks")}</a>
                </li>
                <li>
                  <a href="#system">{t("footer.system")}</a>
                </li>
                <li>
                  <a href="#pricing">{t("footer.pricing")}</a>
                </li>
              </ul>
            </div>
            <div className="col">
              <h4>{t("footer.trust")}</h4>
              <ul>
                <li>
                  <Link href="/privacidad">{t("footer.privacy")}</Link>
                </li>
                <li>
                  <Link href="/terminos">{t("footer.terms")}</Link>
                </li>
                <li>
                  <Link href="/terminos">{t("footer.disclaimer")}</Link>
                </li>
              </ul>
            </div>
            <div className="col">
              <h4>{t("footer.reach")}</h4>
              <ul>
                <li>
                  <Link href="/sign-up">{t("footer.partners")}</Link>
                </li>
                <li>
                  <Link href="/sign-up">{t("footer.contact")}</Link>
                </li>
                <li>
                  <Link href="/sign-up">{t("footer.instagram")}</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
