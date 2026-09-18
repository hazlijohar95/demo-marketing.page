export default function SectionHeading({ id, eyebrow, strong, rest }) {
  return (
    <>
      {eyebrow ? (
        <p data-slot="section-eyebrow">
          <span aria-hidden="true">#</span> {eyebrow}
        </p>
      ) : null}
      <h2 data-slot="section-title" id={id ? `${id}-title` : undefined}>
        {/* Self-link is mouse affordance, not a tab stop: the heading itself
            already announces, and six extra identical stops cost keyboard
            users. tabindex=-1 keeps click + deep-link without tab order. */}
        <a data-slot="heading-link" href={id ? `#${id}` : undefined} tabIndex={-1}>
          <span data-slot="heading-anchor" aria-hidden="true">
            #
          </span>
          <strong>{strong}</strong>
          {rest ? ` ${rest}` : null}
        </a>
      </h2>
    </>
  )
}
