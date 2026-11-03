import css from "styled-jsx/css";

// Existing global selectors; mounted by the owning component in the original order.
export default css.global`
        .nr-program-details {
          min-height: 100vh;
          background: #f5f8fd;
          color: #14253d;
        }

        .nr-program-details-container {
          width: min(1360px, calc(100% - 56px));
          margin-inline: auto;
        }

        .nr-program-details-hero {
          position: relative;
          min-height: 580px;
          overflow: hidden;
          background:
            radial-gradient(circle at 20% 20%, rgba(23, 111, 232, 0.28), transparent 36%),
            #07182c;
        }

        .nr-program-details-cover {
          object-fit: cover;
          object-position: center 58%;
        }

        .nr-program-details-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(4, 18, 34, 0.38) 0%,
              rgba(4, 18, 34, 0.58) 45%,
              rgba(4, 18, 34, 0.94) 100%
            ),
            linear-gradient(
              0deg,
              rgba(4, 18, 34, 0.72),
              transparent 58%
            );
        }

        [dir="rtl"] .nr-program-details-overlay {
          background:
            linear-gradient(
              270deg,
              rgba(4, 18, 34, 0.38) 0%,
              rgba(4, 18, 34, 0.58) 45%,
              rgba(4, 18, 34, 0.94) 100%
            ),
            linear-gradient(
              0deg,
              rgba(4, 18, 34, 0.72),
              transparent 58%
            );
        }

        .nr-program-details-hero-content {
          position: relative;
          z-index: 2;
          min-height: 580px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-block: 96px 64px;
        }

        .nr-program-details-back {
          position: absolute;
          top: 42px;
          inset-inline-start: 0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition:
            opacity 160ms ease,
            transform 160ms ease;
        }

        .nr-program-details-back:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        [dir="rtl"] .nr-program-details-back svg {
          transform: rotate(180deg);
        }

        .nr-program-details-copy {
          max-width: 900px;
          color: #fff;
        }

        .nr-program-details-top-tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .nr-program-details-badge,
        .nr-program-details-country {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding-inline: 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
        }

        .nr-program-details-badge {
          color: #16365d;
          background: #ffc313;
        }

        .nr-program-details-country {
          color: #d5eaff;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
        }

        .nr-program-details-copy h1 {
          margin: 18px 0 12px;
          font-size: clamp(48px, 5.5vw, 76px);
          line-height: 1.04;
          letter-spacing: -0.035em;
        }

        .nr-program-details-copy > p {
          max-width: 760px;
          margin: 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 16px;
          line-height: 1.9;
        }

        .nr-program-details-facts {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .nr-program-details-facts span {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding-inline: 15px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.11);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
        }

        .nr-program-details-facts span.is-price {
          gap: 6px;
          color: #1c3558;
          border-color: rgba(255, 195, 19, 0.52);
          background: #ffc313;
        }

        .nr-program-details-facts .is-price small {
          font-size: 9px;
          font-weight: 900;
          opacity: 0.72;
        }

        .nr-program-details-facts svg {
          width: 17px;
          color: #ffc313;
        }

        .nr-program-details-facts .is-price svg {
          color: #1c3558;
        }


        .nr-program-details-subnav {
          position: sticky;
          top: 0;
          z-index: 20;
          border-bottom: 1px solid rgba(23, 111, 232, 0.10);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 8px 30px rgba(20, 59, 102, 0.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .nr-program-details-subnav-inner {
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .nr-program-details-subnav-inner::-webkit-scrollbar {
          display: none;
        }

        .nr-program-details-subnav a {
          flex: 0 0 auto;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding-inline: 12px;
          border-radius: 999px;
          color: #62758c;
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
          transition:
            color 160ms ease,
            background 160ms ease;
        }

        .nr-program-details-subnav a:hover {
          color: #176fe8;
          background: rgba(23, 111, 232, 0.08);
        }

        .nr-program-details-section {
          scroll-margin-top: 82px;
        }

        .nr-program-details-overview {
          background:
            radial-gradient(
              circle at 92% 8%,
              rgba(23, 111, 232, 0.06),
              transparent 28%
            ),
            #fff;
        }

        .nr-program-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 24px;
          padding-block: 42px 76px;
        }

        .nr-program-details-main {
          display: grid;
          gap: 20px;
        }

        .nr-program-details-section {
          padding: 24px;
          border: 1px solid #dce5f0;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 20px 60px rgba(20, 59, 102, 0.07);
        }

        .nr-program-details-kicker {
          color: #176fe8;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.03em;
        }

        .nr-program-details-section h2 {
          margin: 7px 0 18px;
          color: #14253d;
          font-size: clamp(24px, 3vw, 30px);
        }

        .nr-program-details-description {
          margin: 0;
          color: #687b92;
          line-height: 2;
          white-space: pre-line;
        }

        .nr-program-details-trust {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 22px;
        }

        .nr-program-details-trust > div {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 62px;
          padding: 12px;
          border-radius: 13px;
          color: #526981;
          background: #f6f9fd;
          font-size: 11px;
          font-weight: 800;
        }

        .nr-program-details-trust svg {
          flex: 0 0 auto;
          width: 18px;
          color: #176fe8;
        }

        .nr-program-details-hotels {
          display: grid;
          gap: 20px;
        }

        .nr-program-details-hotel {
          overflow: hidden;
          border: 1px solid #dce5f0;
          border-radius: 24px;
          background: #fff;
        }

        .nr-program-details-hotel-cover {
          position: relative;
          height: 285px;
          overflow: hidden;
          background: #e8eef6;
        }

        .nr-program-details-hotel-image {
          object-fit: cover;
          transition: transform 350ms ease;
        }

        .nr-program-details-hotel:hover .nr-program-details-hotel-image {
          transform: scale(1.025);
        }

        .nr-program-details-hotel-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #9aabc0;
        }

        .nr-program-details-hotel-placeholder svg {
          width: 46px;
          height: 46px;
        }

        .nr-program-details-stars-floating {
          position: absolute;
          top: 16px;
          inset-inline-end: 16px;
          z-index: 2;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding-inline: 10px;
          border-radius: 999px;
          color: #624800;
          background: rgba(255, 195, 19, 0.95);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
        }

        .nr-program-details-hotel-body {
          padding: 19px;
        }

        .nr-program-details-hotel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .nr-program-details-hotel-heading span {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #176fe8;
          font-size: 11px;
          font-weight: 800;
        }

        .nr-program-details-hotel-heading h3 {
          margin: 6px 0 0;
          color: #17304f;
          font-size: 22px;
        }

        .nr-program-details-hotel-body > p {
          color: #687b92;
          line-height: 1.8;
        }

        .nr-program-details-hotel-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 18px;
        }

        .nr-program-details-hotel-meta span {
          min-height: 74px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px;
          border-radius: 13px;
          color: #63758b;
          background: #f5f8fd;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
        }

        .nr-program-details-hotel-meta svg {
          width: 19px;
          color: #176fe8;
        }

        .nr-program-details-dates {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
          color: #718198;
          font-size: 12px;
        }

        .nr-program-details-notes {
          padding: 12px;
          border-radius: 10px;
          background: #f7f9fc;
        }

        .nr-program-details-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          padding: 0 22px 22px;
        }

        .nr-program-details-gallery-item {
          position: relative;
          height: 108px;
          overflow: hidden;
          border-radius: 12px;
          background: #e8eef6;
        }

        .nr-program-details-gallery-item img {
          object-fit: cover;
          transition: transform 250ms ease;
        }

        .nr-program-details-gallery-item:hover img {
          transform: scale(1.04);
        }

        .nr-program-details-gallery-more {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #fff;
          background: rgba(5, 19, 35, 0.62);
          font-size: 22px;
          font-weight: 900;
        }

        .nr-program-details-empty {
          padding: 25px;
          border: 1px dashed #d5deea;
          border-radius: 15px;
          color: #7b8ba0;
          background: #f8fafd;
          text-align: center;
        }

        .nr-program-flight-policy {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
          padding: 14px 16px;
          border: 1px solid #dce5f0;
          border-radius: 14px;
          background: #f8fafd;
        }

        .nr-program-flight-policy > svg {
          flex: 0 0 auto;
          margin-top: 2px;
          color: #176fe8;
        }

        .nr-program-flight-policy div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nr-program-flight-policy strong {
          color: #17304f;
          font-size: 13px;
        }

        .nr-program-flight-policy span {
          color: #6f7e92;
          font-size: 11px;
          line-height: 1.7;
        }

        .nr-program-flight-policy-included {
          border-color: rgba(22, 163, 74, 0.2);
          background: rgba(22, 163, 74, 0.05);
        }

        .nr-program-flight-policy-excluded {
          border-color: rgba(220, 38, 38, 0.16);
          background: rgba(220, 38, 38, 0.04);
        }

        .nr-program-flight-policy-dynamic {
          border-color: rgba(23, 111, 232, 0.18);
          background: rgba(23, 111, 232, 0.05);
        }

        .nr-program-flights-public {
          display: grid;
          gap: 16px;
        }

        .nr-program-flight-public-card {
          padding: 17px;
          border: 1px solid #dce5f0;
          border-radius: 18px;
          background: #fff;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .nr-program-flight-public-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(20, 59, 102, 0.08);
        }

        .nr-program-flight-public-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .nr-program-flight-public-header h3 {
          margin: 7px 0 0;
          font-size: 19px;
        }

        .nr-program-flight-public-direction {
          display: inline-flex;
          min-height: 25px;
          align-items: center;
          padding-inline: 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
        }

        .nr-program-flight-public-direction.is-outbound {
          color: #176fe8;
          background: rgba(23, 111, 232, 0.08);
        }

        .nr-program-flight-public-direction.is-return {
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.08);
        }

        .nr-program-flight-number {
          padding: 8px 10px;
          border-radius: 10px;
          color: #17304f;
          background: #f5f8fd;
          font-size: 12px;
        }

        .nr-program-flight-route {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px minmax(0, 1fr);
          align-items: center;
          gap: 14px;
          padding: 18px;
          border-radius: 15px;
          background: #f8fafd;
        }

        .nr-program-flight-route > div:not(.nr-program-flight-route-line) {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nr-program-flight-route svg {
          width: 18px;
          color: #176fe8;
        }

        .nr-program-flight-route span {
          color: #8a98aa;
          font-size: 10px;
          font-weight: 800;
        }

        .nr-program-flight-route strong {
          color: #17304f;
          font-size: 13px;
          line-height: 1.6;
        }

        .nr-program-flight-route small {
          color: #687b92;
          font-size: 10px;
        }

        .nr-program-flight-route-line {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .nr-program-flight-route-line span {
          height: 1px;
          flex: 1;
          background: #cfd9e6;
        }

        .nr-program-flight-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .nr-program-flight-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding-inline: 10px;
          border-radius: 10px;
          color: #62758c;
          background: #f5f8fd;
          font-size: 10px;
          font-weight: 800;
        }

        .nr-program-flight-meta svg {
          width: 15px;
          color: #176fe8;
        }

        .nr-program-flight-transit-public {
          display: flex;
          gap: 10px;
          margin-top: 13px;
          padding: 12px;
          border: 1px dashed rgba(217, 119, 6, 0.25);
          border-radius: 11px;
          background: rgba(245, 158, 11, 0.05);
        }

        .nr-program-flight-transit-public > svg {
          flex: 0 0 auto;
          width: 17px;
          color: #b45309;
        }

        .nr-program-flight-transit-public div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .nr-program-flight-transit-public strong {
          color: #9a4f06;
          font-size: 11px;
        }

        .nr-program-flight-transit-public span {
          color: #7d6b58;
          font-size: 10px;
        }

        .nr-program-flight-public-notes {
          margin: 13px 0 0;
          padding: 11px 12px;
          border-radius: 10px;
          color: #687b92;
          background: #f8fafd;
          font-size: 11px;
          line-height: 1.8;
        }


        .nr-program-transports-public {
          display: grid;
          gap: 16px;
        }

        .nr-program-transport-public-card {
          padding: 17px;
          border: 1px solid #dce5f0;
          border-radius: 18px;
          background: #fff;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .nr-program-transport-public-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(20, 59, 102, 0.08);
        }

        .nr-program-transport-public-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .nr-program-transport-public-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 7px 0 0;
          color: #17304f;
          font-size: 19px;
        }

        .nr-program-transport-public-header h3 svg {
          color: #176fe8;
        }

        .nr-program-transport-day {
          display: inline-flex;
          min-height: 25px;
          align-items: center;
          padding-inline: 9px;
          border-radius: 999px;
          color: #176fe8;
          background: rgba(23, 111, 232, 0.08);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-program-transport-inclusion {
          display: inline-flex;
          min-height: 29px;
          align-items: center;
          padding-inline: 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .nr-program-transport-inclusion.is-included {
          color: #047857;
          background: rgba(16, 185, 129, 0.1);
        }

        .nr-program-transport-inclusion.is-excluded {
          color: #b45309;
          background: rgba(245, 158, 11, 0.11);
        }

        .nr-program-transport-route {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1fr);
          align-items: center;
          gap: 12px;
          padding: 18px;
          border-radius: 15px;
          background: #f8fafd;
        }

        .nr-program-transport-route > div:not(.nr-program-transport-route-line) {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nr-program-transport-route svg {
          width: 18px;
          color: #176fe8;
        }

        .nr-program-transport-route span {
          color: #8a98aa;
          font-size: 10px;
          font-weight: 800;
        }

        .nr-program-transport-route strong {
          color: #17304f;
          font-size: 13px;
          line-height: 1.6;
        }

        .nr-program-transport-route-line {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .nr-program-transport-route-line span {
          height: 1px;
          flex: 1;
          background: #cfd9e6;
        }

        .nr-program-transport-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .nr-program-transport-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding-inline: 10px;
          border-radius: 10px;
          color: #62758c;
          background: #f5f8fd;
          font-size: 10px;
          font-weight: 800;
        }

        .nr-program-transport-meta svg {
          width: 15px;
          color: #176fe8;
        }

        .nr-program-transport-notes {
          margin: 13px 0 0;
          padding: 11px 12px;
          border-radius: 10px;
          color: #687b92;
          background: #f8fafd;
          font-size: 11px;
          line-height: 1.8;
          white-space: pre-line;
        }


        .nr-program-visas-public {
          display: grid;
          gap: 16px;
        }

        .nr-program-visa-public-card {
          padding: 17px;
          border: 1px solid #dce5f0;
          border-radius: 18px;
          background: #fff;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .nr-program-visa-public-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(20, 59, 102, 0.08);
        }

        .nr-program-visa-public-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .nr-program-visa-public-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 7px 0 0;
          color: #17304f;
          font-size: 19px;
        }

        .nr-program-visa-public-header h3 svg {
          color: #176fe8;
        }

        .nr-program-visa-type {
          display: inline-flex;
          min-height: 25px;
          align-items: center;
          padding-inline: 9px;
          border-radius: 999px;
          color: #176fe8;
          background: rgba(23, 111, 232, 0.08);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-program-visa-inclusion {
          display: inline-flex;
          min-height: 29px;
          align-items: center;
          padding-inline: 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .nr-program-visa-inclusion.is-included {
          color: #047857;
          background: rgba(16, 185, 129, 0.1);
        }

        .nr-program-visa-inclusion.is-excluded {
          color: #b45309;
          background: rgba(245, 158, 11, 0.11);
        }

        .nr-program-visa-description {
          margin: 14px 0 0;
          color: #687b92;
          font-size: 12px;
          line-height: 1.9;
          white-space: pre-line;
        }

        .nr-program-visa-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .nr-program-visa-meta span {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          gap: 6px;
          padding-inline: 10px;
          border-radius: 10px;
          color: #62758c;
          background: #f5f8fd;
          font-size: 10px;
          font-weight: 800;
        }

        .nr-program-visa-meta svg {
          width: 15px;
          color: #176fe8;
        }

        .nr-program-visa-requirements {
          margin-top: 15px;
          padding: 14px;
          border: 1px solid rgba(23, 111, 232, 0.12);
          border-radius: 13px;
          background: rgba(23, 111, 232, 0.035);
        }

        .nr-program-visa-requirements-heading {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #17304f;
          font-size: 12px;
        }

        .nr-program-visa-requirements-heading svg {
          width: 17px;
          color: #176fe8;
        }

        .nr-program-visa-requirements ul {
          display: grid;
          gap: 8px;
          margin: 12px 0 0;
          padding: 0;
          list-style: none;
        }

        .nr-program-visa-requirements li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #63758b;
          font-size: 11px;
          line-height: 1.7;
        }

        .nr-program-visa-requirements li svg {
          flex: 0 0 auto;
          width: 15px;
          margin-top: 2px;
          color: #16a34a;
        }

        .nr-program-visa-notes {
          margin: 13px 0 0;
          padding: 11px 12px;
          border-radius: 10px;
          color: #687b92;
          background: #f8fafd;
          font-size: 11px;
          line-height: 1.8;
          white-space: pre-line;
        }

        .nr-program-details-booking {
          position: sticky;
          top: 24px;
          height: fit-content;
          padding: 22px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background:
            radial-gradient(circle at 15% 0%, rgba(23, 111, 232, 0.32), transparent 38%),
            #0b294b;
          color: #fff;
          box-shadow: 0 25px 70px rgba(11, 41, 75, 0.2);
        }

        .nr-program-details-booking-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 18px;
          padding: 7px 9px;
          border-radius: 999px;
          color: #d7e8fb;
          background: rgba(255, 255, 255, 0.08);
          font-size: 10px;
          font-weight: 800;
        }

        .nr-program-details-booking > span:not(.nr-program-details-book) {
          display: block;
          color: rgba(255, 255, 255, 0.62);
          font-size: 12px;
        }

        .nr-program-details-booking > strong {
          display: block;
          margin-top: 8px;
          color: #ffc313;
          font-size: 38px;
          line-height: 1;
        }

        .nr-program-details-booking strong small {
          margin-inline-start: 5px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
        }

        .nr-program-details-booking-facts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }

        .nr-program-details-booking-facts span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 32px;
          padding-inline: 9px;
          border-radius: 9px;
          color: rgba(255, 255, 255, 0.78);
          background: rgba(255, 255, 255, 0.07);
          font-size: 10px;
          font-weight: 800;
        }

        .nr-program-details-booking-facts svg {
          width: 14px;
          color: #ffc313;
        }


        .nr-program-details-booking-trust {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .nr-program-details-booking-trust span {
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding-inline: 8px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          color: rgba(255,255,255,.75);
          background: rgba(255,255,255,.05);
          font-size: 9px;
          font-weight: 800;
        }

        .nr-program-details-booking-trust svg {
          color: #ffc313;
        }

        .nr-program-details-booking p {
          color: rgba(255, 255, 255, 0.67);
          font-size: 12px;
          line-height: 1.8;
        }

        .nr-program-details-book {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 19px;
          border-radius: 13px;
          color: #12345d;
          background: #ffc313;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .nr-program-details-book:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(255, 195, 19, 0.22);
        }

        .nr-program-details-booking-hint {
          display: block;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 10px;
          text-align: center;
        }

        .nr-program-details-state {
          min-height: 100vh;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 12px;
          padding: 24px;
          color: #14253d;
          background: #f5f8fd;
          text-align: center;
        }

        .nr-program-details-state strong {
          font-size: 38px;
        }

        .nr-program-details-state a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding-inline: 16px;
          border-radius: 11px;
          color: #fff;
          background: #176fe8;
          text-decoration: none;
          font-weight: 800;
        }

        .nr-program-details-loader {
          width: 34px;
          height: 34px;
          border: 3px solid #dce7f5;
          border-top-color: #176fe8;
          border-radius: 50%;
          animation: nrProgramSpin 0.8s linear infinite;
        }

        @keyframes nrProgramSpin {
          to {
            transform: rotate(360deg);
          }
        }



        html[data-theme="dark"] .nr-program-details {
          background: #07182c;
          color: #f4f8ff;
        }

        html[data-theme="dark"] .nr-program-details-subnav {
          border-bottom-color: rgba(255,255,255,.08);
          background: rgba(7, 24, 44, .9);
        }

        html[data-theme="dark"] .nr-program-details-subnav a {
          color: #a9b8c9;
        }

        html[data-theme="dark"] .nr-program-details-section,
        html[data-theme="dark"] .nr-program-details-hotel,
        html[data-theme="dark"] .nr-program-flight-public-card,
        html[data-theme="dark"] .nr-program-transport-public-card,
        html[data-theme="dark"] .nr-program-visa-public-card {
          border-color: rgba(255,255,255,.09);
          background: #0c223d;
          box-shadow: 0 18px 55px rgba(0,0,0,.2);
        }

        html[data-theme="dark"] .nr-program-details-overview {
          background:
            radial-gradient(circle at 92% 8%, rgba(23,111,232,.12), transparent 28%),
            #0c223d;
        }

        html[data-theme="dark"] .nr-program-details-section h2,
        html[data-theme="dark"] .nr-program-details-hotel-heading h3,
        html[data-theme="dark"] .nr-program-flight-public-header h3,
        html[data-theme="dark"] .nr-program-transport-public-header h3,
        html[data-theme="dark"] .nr-program-visa-public-header h3,
        html[data-theme="dark"] .nr-program-flight-route strong,
        html[data-theme="dark"] .nr-program-transport-route strong,
        html[data-theme="dark"] .nr-program-visa-requirements-heading {
          color: #f4f8ff;
        }

        html[data-theme="dark"] .nr-program-details-description,
        html[data-theme="dark"] .nr-program-details-hotel-body > p,
        html[data-theme="dark"] .nr-program-flight-public-notes,
        html[data-theme="dark"] .nr-program-transport-notes,
        html[data-theme="dark"] .nr-program-visa-description,
        html[data-theme="dark"] .nr-program-visa-notes {
          color: #a9b8c9;
        }

        html[data-theme="dark"] .nr-program-details-trust > div,
        html[data-theme="dark"] .nr-program-details-hotel-meta span,
        html[data-theme="dark"] .nr-program-flight-route,
        html[data-theme="dark"] .nr-program-flight-meta span,
        html[data-theme="dark"] .nr-program-transport-route,
        html[data-theme="dark"] .nr-program-transport-meta span,
        html[data-theme="dark"] .nr-program-visa-meta span,
        html[data-theme="dark"] .nr-program-flight-number,
        html[data-theme="dark"] .nr-program-details-empty {
          border-color: rgba(255,255,255,.07);
          background: rgba(255,255,255,.045);
          color: #a9b8c9;
        }

        @media (min-width: 1500px) {
          .nr-program-details-container {
            width: min(1460px, calc(100% - 72px));
          }

          .nr-program-details-layout {
            grid-template-columns: minmax(0, 1fr) 330px;
          }
        }

        @media (min-width: 921px) and (max-width: 1366px) {
          .nr-program-details-container {
            width: min(1200px, calc(100% - 40px));
          }

          .nr-program-details-hero {
            min-height: 510px;
          }

          .nr-program-details-hero-content {
            min-height: 510px;
            padding-block: 76px 48px;
          }

          .nr-program-details-copy h1 {
            font-size: clamp(38px, 4.4vw, 56px);
          }

          .nr-program-details-layout {
            grid-template-columns: minmax(0, 1fr) 300px;
          }
        }

        @media (max-width: 980px) {
          .nr-program-details-layout {
            grid-template-columns: 1fr;
          }

          .nr-program-details-booking {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .nr-program-details-subnav-inner {
            min-height: 54px;
            gap: 5px;
          }

          .nr-program-details-subnav a {
            min-height: 32px;
            padding-inline: 10px;
          }


          .nr-program-details-hero,
          .nr-program-details-hero-content {
            min-height: 545px;
          }

          .nr-program-details-copy h1 {
            font-size: 40px;
            line-height: 1.08;
          }

          .nr-program-details-layout {
            padding-block: 34px 70px;
          }

          .nr-program-details-section {
            padding: 17px;
            border-radius: 19px;
          }

          .nr-program-details-trust {
            grid-template-columns: 1fr;
          }

          .nr-program-details-hotel-cover {
            height: 235px;
          }

          .nr-program-details-hotel-meta {
            grid-template-columns: 1fr;
          }

          .nr-program-details-gallery {
            grid-template-columns: repeat(2, 1fr);
          }

          .nr-program-flight-route,
          .nr-program-transport-route {
            grid-template-columns: 1fr;
          }

          .nr-program-flight-route-line,
          .nr-program-transport-route-line {
            width: 70px;
            margin: 2px auto;
            transform: rotate(90deg);
          }

          .nr-program-details-booking {
            border-radius: 18px;
          }
        }

        @media (max-width: 480px) {
          .nr-program-details-container {
            width: min(100% - 22px, 1180px);
          }

          .nr-program-details-copy h1 {
            font-size: 34px;
            line-height: 1.1;
          }

          .nr-program-details-copy > p {
            font-size: 14px;
          }

          .nr-program-details-facts {
            gap: 8px;
          }

          .nr-program-details-facts span {
            min-height: 44px;
            padding-inline: 11px;
            font-size: 11px;
          }

          .nr-program-details-gallery {
            grid-template-columns: 1fr 1fr;
            padding-inline: 14px;
            padding-bottom: 14px;
          }

          .nr-program-details-gallery-item {
            height: 105px;
          }

          .nr-program-flight-public-card {
            padding: 15px;
          }

          .nr-program-flight-public-header,
          .nr-program-visa-public-header {
            flex-direction: column;
          }
        }
      `;
