import css from 'styled-jsx/css';

// Scoped to the public details view; all existing data and section states remain.
export default css.global`
  .programs-shell .nr-program-details {
    --pd-bg: #f7f9fc;
    --pd-card: #fff;
    --pd-ink: #152f4b;
    --pd-muted: #465b73;
    --pd-border: #d8e2ed;
    --pd-blue: #1258b5;
    background: var(--pd-bg);
    color: var(--pd-ink);
    font-family: var(--font-cairo), sans-serif;
  }
  .programs-shell .nr-program-details .nr-program-details-container {
    width: min(1240px, calc(100% - 48px));
  }
  .programs-shell .nr-program-details .nr-program-refreshed-hero {
    min-height: 0;
    padding: 28px 0 30px;
    background: var(--pd-card);
    overflow: visible;
  }
  .programs-shell .nr-program-details .nr-program-details-hero-content { min-height: 0; display: block; padding: 0; }
  .nr-program-details-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 28px;
    font-size: 12px;
    color: var(--pd-muted);
  }
  .nr-program-details-breadcrumbs a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 36px;
    color: var(--pd-blue);
    text-decoration: none;
  }
  .nr-program-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
    align-items: center;
    gap: 42px;
    margin-bottom: 24px;
  }
  .programs-shell .nr-program-details .nr-program-details-copy {
    color: var(--pd-ink);
    max-width: none;
  }
  .programs-shell .nr-program-details .nr-program-details-copy h1 {
    font-size: clamp(30px, 3.1vw, 43px);
    line-height: 1.55;
    font-weight: 800;
    letter-spacing: -.025em;
    margin: 16px 0 12px;
    text-wrap: balance;
  }
  .programs-shell .nr-program-details .nr-program-details-copy > p {
    color: var(--pd-muted);
    font-size: 15px;
    line-height: 1.95;
  }
  .programs-shell .nr-program-details .nr-program-details-country {
    background: var(--pd-bg);
    color: var(--pd-blue);
    border: 1px solid var(--pd-border);
    border-radius: 8px;
    font-size: 12px;
    backdrop-filter: none;
  }
  .programs-shell .nr-program-details .nr-program-details-badge {
    background: #fff0bd;
    color: #674b00;
    font-size: 12px;
    border-radius: 8px;
  }
  .programs-shell .nr-program-details .nr-program-details-facts {
    gap: 8px 16px;
    margin-top: 18px;
  }
  .programs-shell .nr-program-details .nr-program-details-facts > span {
    background: transparent;
    border: 0;
    box-shadow: none;
    backdrop-filter: none;
    padding: 0;
    min-height: 32px;
    color: var(--pd-muted);
    font-size: 13px;
  }
  .programs-shell .nr-program-details .nr-program-details-facts svg {
    width: 17px;
    height: 17px;
    color: var(--pd-blue);
  }
  .programs-shell .nr-program-details .nr-program-details-facts strong {
    color: var(--pd-ink);
    font-size: 13px;
    font-weight: 600;
  }
  .nr-program-hero-price {
    display: flex;
    gap: 16px;
    align-items: baseline;
    flex-wrap: wrap;
    margin-top: 20px;
    color: var(--pd-muted);
    font-size: 13px;
  }
  .nr-program-hero-price strong {
    display: inline-flex;
    gap: 8px;
    align-items: baseline;
    font-size: 29px;
    color: var(--pd-ink);
    font-weight: 800;
  }
  .nr-program-hero-price bdi:last-child {
    font-size: 15px;
    font-weight: 600;
  }
  .programs-shell .nr-program-details-copy .program-price-note {
    font-size: 12px;
    margin-block: 8px 0;
    color: var(--pd-muted);
  }
  .nr-program-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 22px;
  }
  .nr-program-hero-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 10px 16px;
    border: 1px solid var(--pd-border);
    border-radius: 10px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
    color: var(--pd-ink);
    background: var(--pd-card);
  }
  .nr-program-hero-actions a:first-child {
    color: #152f4b;
    background: #ffc313;
    border-color: #ffc313;
  }
  [dir='rtl'] .nr-program-details-breadcrumbs svg,
  [dir='rtl'] .nr-program-hero-actions a:first-child svg,
  [dir='rtl'] .nr-program-enquiry svg { transform: rotate(180deg); }
  .programs-shell .nr-program-details .nr-program-details-subnav {
    position: sticky;
    top: 0;
    z-index: 35;
    background: var(--pd-card);
    border-top: 1px solid var(--pd-border);
    border-bottom: 1px solid var(--pd-border);
    box-shadow: 0 8px 20px #16324e05;
  }
  .programs-shell .nr-program-details .nr-program-details-subnav-inner {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    padding-block: 12px;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .programs-shell .nr-program-details .nr-program-details-subnav a {
    flex-shrink: 0;
    color: var(--pd-muted);
    font-size: 13px;
    padding: 10px 14px;
    white-space: nowrap;
    border-radius: 9px;
  }
  .programs-shell .nr-program-details .nr-program-details-layout {
    grid-template-columns: minmax(0, 1fr) 310px;
    align-items: start;
    gap: 28px;
    padding-top: 32px;
  }
  .programs-shell .nr-program-details .nr-program-details-main { gap: 24px; }
  .programs-shell .nr-program-details .nr-program-details-section {
    background: var(--pd-card);
    border: 1px solid var(--pd-border);
    border-radius: 18px;
    box-shadow: none;
    padding: 28px;
    scroll-margin-top: 94px;
  }
  .programs-shell .nr-program-details .nr-program-details-overview {
    background: var(--pd-card);
  }
  .programs-shell .nr-program-details .nr-program-details-section h2 {
    color: var(--pd-ink);
    font-size: 25px;
    line-height: 1.6;
    font-weight: 800;
  }
  .programs-shell .nr-program-details .nr-program-details-description {
    color: var(--pd-muted);
    font-size: 16px;
    line-height: 2;
  }
  .programs-shell .nr-program-details .nr-program-display-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    overflow: hidden;
    border: 1px solid var(--pd-border);
    border-radius: 16px;
    background: var(--pd-card);
  }
  .programs-shell .nr-program-details .nr-program-display-summary p {
    padding: 16px 20px;
    margin: 0;
    font-size: 13px;
    line-height: 1.9;
    color: var(--pd-muted);
    border-bottom: 1px solid var(--pd-border);
  }
  .programs-shell .nr-program-details .nr-program-details-booking {
    top: 92px;
    border: 1px solid #284b70;
    box-shadow: 0 10px 30px #17355712;
    border-radius: 18px;
    padding: 24px;
  }
  .programs-shell .nr-program-details .nr-program-price-amount {
    display: flex;
    gap: 9px;
    align-items: baseline;
    justify-content: flex-start;
    font-size: 36px;
  }
  .programs-shell .nr-program-details .nr-program-price-amount small {
    margin: 0;
    font-size: 16px;
  }
  .nr-program-enquiry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #c3ddff;
    padding: 14px 0;
    font-size: 13px;
    text-underline-offset: 4px;
    border-top: 1px solid #426181;
    margin-top: 18px;
  }
  .programs-shell .nr-program-details .nr-program-details-hotel {
    border: 1px solid var(--pd-border);
    border-radius: 14px;
    box-shadow: none;
    overflow: hidden;
  }
  .programs-shell .nr-program-details .nr-program-details-hotel-body { padding: 22px; }
  .programs-shell .nr-program-details .nr-program-details-hotel-heading h3 {
    color: var(--pd-ink);
    font-size: 20px;
    line-height: 1.7;
  }
  html[data-theme='dark'] .programs-shell .nr-program-details {
    --pd-bg: #07182b;
    --pd-card: #10243a;
    --pd-ink: #f0f6ff;
    --pd-muted: #c1d0e1;
    --pd-border: #38516c;
    --pd-blue: #9dc6ff;
  }
  @media(max-width: 1100px) {
    .nr-program-hero-grid { gap: 28px; }
    .programs-shell .nr-program-details .nr-program-details-layout {
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 22px;
    }
    .programs-shell .nr-program-details .nr-program-details-section { padding: 22px; }
  }
  @media(max-width: 900px) {
    .nr-program-hero-grid { grid-template-columns: 1fr; gap: 24px; }
    .programs-shell .nr-program-details .nr-program-details-copy { max-width: 800px; }
    .programs-shell .nr-program-details .nr-program-details-copy h1 { font-size: 34px; }
    .programs-shell .nr-program-details .nr-program-details-layout { grid-template-columns: 1fr; }
    .programs-shell .nr-program-details .nr-program-details-booking { position: static; }
  }
  @media(max-width: 560px) {
    .programs-shell .nr-program-details .nr-program-details-container { width: calc(100% - 32px); }
    .programs-shell .nr-program-details .nr-program-details-copy h1 { font-size: 28px; line-height: 1.6; }
    .programs-shell .nr-program-details .nr-program-refreshed-hero { padding-top: 16px; }
    .nr-program-details-breadcrumbs { margin-bottom: 16px; font-size: 11px; }
    .programs-shell .nr-program-details .nr-program-details-copy > p { font-size: 14px; }
    .nr-program-hero-actions { gap: 8px; }
    .nr-program-hero-actions a { font-size: 12px; padding: 10px 12px; }
    .programs-shell .nr-program-details .nr-program-display-summary { grid-template-columns: 1fr; }
    .programs-shell .nr-program-details .nr-program-details-section { padding: 20px; border-radius: 14px; }
    .programs-shell .nr-program-details .nr-program-details-section h2 { font-size: 22px; }
  }
`;
