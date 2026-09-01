"use client";

import { useState } from "react";
import { updateContact } from "@/lib/actions/crm";

function linkLabel(url) {
  if (/facebook\.com/i.test(url)) return "Facebook";
  if (/instagram\.com/i.test(url)) return "Instagram";
  return "Social";
}

function ensureHttp(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function ContactPanel({ account }) {
  const [editing, setEditing] = useState(false);
  const hasAny = account.email || account.phone || account.website || account.socialUrl;

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="panel-head">
        <h3>Contact</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {!editing && (
        <div className="contact-links">
          {account.email && (
            <a className="contact-link" href={`mailto:${account.email}`}>
              ✉ {account.email}
            </a>
          )}
          {account.phone && (
            <a className="contact-link" href={`tel:${account.phone.replace(/[^\d+]/g, "")}`}>
              ☎ {account.phone}
            </a>
          )}
          {account.website && (
            <a className="contact-link" href={ensureHttp(account.website)} target="_blank" rel="noopener noreferrer">
              ⌂ Website
            </a>
          )}
          {account.socialUrl && (
            <a className="contact-link" href={ensureHttp(account.socialUrl)} target="_blank" rel="noopener noreferrer">
              ⚡ {linkLabel(account.socialUrl)}
            </a>
          )}
          {!hasAny && <span className="empty-row">No contact channels on file — hit Edit to add some.</span>}
        </div>
      )}

      {editing && (
        <form
          action={async (formData) => {
            await updateContact(account.id, formData);
            setEditing(false);
          }}
          className="contact-form"
        >
          <input type="text" name="contactName" placeholder="Contact name" defaultValue={account.contactName || ""} />
          <input type="email" name="email" placeholder="Email" defaultValue={account.email || ""} />
          <input type="text" name="phone" placeholder="Phone" defaultValue={account.phone || ""} />
          <input type="text" name="website" placeholder="Website URL" defaultValue={account.website || ""} />
          <input type="text" name="socialUrl" placeholder="Facebook / Instagram URL" defaultValue={account.socialUrl || ""} />
          <button className="btn btn-primary btn-sm" type="submit">
            Save
          </button>
        </form>
      )}
    </div>
  );
}
