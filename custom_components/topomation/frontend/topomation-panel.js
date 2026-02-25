/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis, Ye = ne.ShadowRoot && (ne.ShadyCSS === void 0 || ne.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Ge = Symbol(), ni = /* @__PURE__ */ new WeakMap();
let Ri = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== Ge) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Ye && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = ni.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && ni.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const fo = (n) => new Ri(typeof n == "string" ? n : n + "", void 0, Ge), Tt = (n, ...t) => {
  const e = n.length === 1 ? n[0] : t.reduce((i, o, a) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + n[a + 1], n[0]);
  return new Ri(e, n, Ge);
}, go = (n, t) => {
  if (Ye) n.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), o = ne.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = e.cssText, n.appendChild(i);
  }
}, ai = Ye ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return fo(e);
})(n) : n;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: mo, defineProperty: _o, getOwnPropertyDescriptor: vo, getOwnPropertyNames: yo, getOwnPropertySymbols: bo, getPrototypeOf: wo } = Object, rt = globalThis, ri = rt.trustedTypes, xo = ri ? ri.emptyScript : "", $e = rt.reactiveElementPolyfillSupport, zt = (n, t) => n, Fe = { toAttribute(n, t) {
  switch (t) {
    case Boolean:
      n = n ? xo : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, t) {
  let e = n;
  switch (t) {
    case Boolean:
      e = n !== null;
      break;
    case Number:
      e = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(n);
      } catch {
        e = null;
      }
  }
  return e;
} }, Fi = (n, t) => !mo(n, t), si = { attribute: !0, type: String, converter: Fe, reflect: !1, useDefault: !1, hasChanged: Fi };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), rt.litPropertyMetadata ?? (rt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let xt = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = si) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(t, i, e);
      o !== void 0 && _o(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: o, set: a } = vo(this.prototype, t) ?? { get() {
      return this[e];
    }, set(r) {
      this[e] = r;
    } };
    return { get: o, set(r) {
      const s = o == null ? void 0 : o.call(this);
      a == null || a.call(this, r), this.requestUpdate(t, s, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? si;
  }
  static _$Ei() {
    if (this.hasOwnProperty(zt("elementProperties"))) return;
    const t = wo(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(zt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(zt("properties"))) {
      const e = this.properties, i = [...yo(e), ...bo(e)];
      for (const o of i) this.createProperty(o, e[o]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, o] of e) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const o = this._$Eu(e, i);
      o !== void 0 && this._$Eh.set(o, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const o of i) e.unshift(ai(o));
    } else t !== void 0 && e.push(ai(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return go(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var a;
    const i = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, i);
    if (o !== void 0 && i.reflect === !0) {
      const r = (((a = i.converter) == null ? void 0 : a.toAttribute) !== void 0 ? i.converter : Fe).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var a, r;
    const i = this.constructor, o = i._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = i.getPropertyOptions(o), c = typeof s.converter == "function" ? { fromAttribute: s.converter } : ((a = s.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? s.converter : Fe;
      this._$Em = o;
      const l = c.fromAttribute(e, s.type);
      this[o] = l ?? ((r = this._$Ej) == null ? void 0 : r.get(o)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var o;
    if (t !== void 0) {
      const a = this.constructor, r = this[t];
      if (i ?? (i = a.getPropertyOptions(t)), !((i.hasChanged ?? Fi)(r, e) || i.useDefault && i.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: o, wrapped: a }, r) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, r ?? e ?? this[t]), a !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, r] of this._$Ep) this[a] = r;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [a, r] of o) {
        const { wrapped: s } = r, c = this[a];
        s !== !0 || this._$AL.has(a) || c === void 0 || this.C(a, void 0, r, c);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((o) => {
        var a;
        return (a = o.hostUpdate) == null ? void 0 : a.call(o);
      }), this.update(e)) : this._$EM();
    } catch (o) {
      throw t = !1, this._$EM(), o;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var o;
      return (o = i.hostUpdated) == null ? void 0 : o.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
xt.elementStyles = [], xt.shadowRootOptions = { mode: "open" }, xt[zt("elementProperties")] = /* @__PURE__ */ new Map(), xt[zt("finalized")] = /* @__PURE__ */ new Map(), $e == null || $e({ ReactiveElement: xt }), (rt.reactiveElementVersions ?? (rt.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ht = globalThis, he = Ht.trustedTypes, ci = he ? he.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Bi = "$lit$", it = `lit$${Math.random().toFixed(9).slice(2)}$`, zi = "?" + it, So = `<${zi}>`, vt = document, jt = () => vt.createComment(""), Xt = (n) => n === null || typeof n != "object" && typeof n != "function", Je = Array.isArray, $o = (n) => Je(n) || typeof (n == null ? void 0 : n[Symbol.iterator]) == "function", Ee = `[ 	
\f\r]`, Pt = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, li = /-->/g, di = />/g, ut = RegExp(`>|${Ee}(?:([^\\s"'>=/]+)(${Ee}*=${Ee}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ui = /'/g, hi = /"/g, Hi = /^(?:script|style|textarea|title)$/i, Eo = (n) => (t, ...e) => ({ _$litType$: n, strings: t, values: e }), m = Eo(1), yt = Symbol.for("lit-noChange"), O = Symbol.for("lit-nothing"), pi = /* @__PURE__ */ new WeakMap(), mt = vt.createTreeWalker(vt, 129);
function Ui(n, t) {
  if (!Je(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ci !== void 0 ? ci.createHTML(t) : t;
}
const Ao = (n, t) => {
  const e = n.length - 1, i = [];
  let o, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = Pt;
  for (let s = 0; s < e; s++) {
    const c = n[s];
    let l, u, d = -1, h = 0;
    for (; h < c.length && (r.lastIndex = h, u = r.exec(c), u !== null); ) h = r.lastIndex, r === Pt ? u[1] === "!--" ? r = li : u[1] !== void 0 ? r = di : u[2] !== void 0 ? (Hi.test(u[2]) && (o = RegExp("</" + u[2], "g")), r = ut) : u[3] !== void 0 && (r = ut) : r === ut ? u[0] === ">" ? (r = o ?? Pt, d = -1) : u[1] === void 0 ? d = -2 : (d = r.lastIndex - u[2].length, l = u[1], r = u[3] === void 0 ? ut : u[3] === '"' ? hi : ui) : r === hi || r === ui ? r = ut : r === li || r === di ? r = Pt : (r = ut, o = void 0);
    const p = r === ut && n[s + 1].startsWith("/>") ? " " : "";
    a += r === Pt ? c + So : d >= 0 ? (i.push(l), c.slice(0, d) + Bi + c.slice(d) + it + p) : c + it + (d === -2 ? s : p);
  }
  return [Ui(n, a + (n[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Yt {
  constructor({ strings: t, _$litType$: e }, i) {
    let o;
    this.parts = [];
    let a = 0, r = 0;
    const s = t.length - 1, c = this.parts, [l, u] = Ao(t, e);
    if (this.el = Yt.createElement(l, i), mt.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (o = mt.nextNode()) !== null && c.length < s; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const d of o.getAttributeNames()) if (d.endsWith(Bi)) {
          const h = u[r++], p = o.getAttribute(d).split(it), f = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: a, name: f[2], strings: p, ctor: f[1] === "." ? To : f[1] === "?" ? Do : f[1] === "@" ? Co : xe }), o.removeAttribute(d);
        } else d.startsWith(it) && (c.push({ type: 6, index: a }), o.removeAttribute(d));
        if (Hi.test(o.tagName)) {
          const d = o.textContent.split(it), h = d.length - 1;
          if (h > 0) {
            o.textContent = he ? he.emptyScript : "";
            for (let p = 0; p < h; p++) o.append(d[p], jt()), mt.nextNode(), c.push({ type: 2, index: ++a });
            o.append(d[h], jt());
          }
        }
      } else if (o.nodeType === 8) if (o.data === zi) c.push({ type: 2, index: a });
      else {
        let d = -1;
        for (; (d = o.data.indexOf(it, d + 1)) !== -1; ) c.push({ type: 7, index: a }), d += it.length - 1;
      }
      a++;
    }
  }
  static createElement(t, e) {
    const i = vt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function At(n, t, e = n, i) {
  var r, s;
  if (t === yt) return t;
  let o = i !== void 0 ? (r = e._$Co) == null ? void 0 : r[i] : e._$Cl;
  const a = Xt(t) ? void 0 : t._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== a && ((s = o == null ? void 0 : o._$AO) == null || s.call(o, !1), a === void 0 ? o = void 0 : (o = new a(n), o._$AT(n, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = o : e._$Cl = o), o !== void 0 && (t = At(n, o._$AS(n, t.values), o, i)), t;
}
let ko = class {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, o = ((t == null ? void 0 : t.creationScope) ?? vt).importNode(e, !0);
    mt.currentNode = o;
    let a = mt.nextNode(), r = 0, s = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let l;
        c.type === 2 ? l = new Dt(a, a.nextSibling, this, t) : c.type === 1 ? l = new c.ctor(a, c.name, c.strings, this, t) : c.type === 6 && (l = new Lo(a, this, t)), this._$AV.push(l), c = i[++s];
      }
      r !== (c == null ? void 0 : c.index) && (a = mt.nextNode(), r++);
    }
    return mt.currentNode = vt, o;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
};
class Dt {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, o) {
    this.type = 2, this._$AH = O, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = At(this, t, e), Xt(t) ? t === O || t == null || t === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : t !== this._$AH && t !== yt && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : $o(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== O && Xt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(vt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var a;
    const { values: e, _$litType$: i } = t, o = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Yt.createElement(Ui(i.h, i.h[0]), this.options)), i);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === o) this._$AH.p(e);
    else {
      const r = new ko(o, this), s = r.u(this.options);
      r.p(e), this.T(s), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = pi.get(t.strings);
    return e === void 0 && pi.set(t.strings, e = new Yt(t)), e;
  }
  k(t) {
    Je(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, o = 0;
    for (const a of t) o === e.length ? e.push(i = new Dt(this.O(jt()), this.O(jt()), this, this.options)) : i = e[o], i._$AI(a), o++;
    o < e.length && (this._$AR(i && i._$AB.nextSibling, o), e.length = o);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const o = t.nextSibling;
      t.remove(), t = o;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class xe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, o, a) {
    this.type = 1, this._$AH = O, this._$AN = void 0, this.element = t, this.name = e, this._$AM = o, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = O;
  }
  _$AI(t, e = this, i, o) {
    const a = this.strings;
    let r = !1;
    if (a === void 0) t = At(this, t, e, 0), r = !Xt(t) || t !== this._$AH && t !== yt, r && (this._$AH = t);
    else {
      const s = t;
      let c, l;
      for (t = a[0], c = 0; c < a.length - 1; c++) l = At(this, s[i + c], e, c), l === yt && (l = this._$AH[c]), r || (r = !Xt(l) || l !== this._$AH[c]), l === O ? t = O : t !== O && (t += (l ?? "") + a[c + 1]), this._$AH[c] = l;
    }
    r && !o && this.j(t);
  }
  j(t) {
    t === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class To extends xe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === O ? void 0 : t;
  }
}
class Do extends xe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== O);
  }
}
class Co extends xe {
  constructor(t, e, i, o, a) {
    super(t, e, i, o, a), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = At(this, t, e, 0) ?? O) === yt) return;
    const i = this._$AH, o = t === O && i !== O || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, a = t !== O && (i === O || o);
    o && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Lo {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    At(this, t);
  }
}
const Io = { I: Dt }, Ae = Ht.litHtmlPolyfillSupport;
Ae == null || Ae(Yt, Dt), (Ht.litHtmlVersions ?? (Ht.litHtmlVersions = [])).push("3.3.1");
const Oo = (n, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let o = i._$litPart$;
  if (o === void 0) {
    const a = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = o = new Dt(t.insertBefore(jt(), a), a, void 0, e ?? {});
  }
  return o._$AI(n), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _t = globalThis;
let Y = class extends xt {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Oo(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return yt;
  }
};
var Ci;
Y._$litElement$ = !0, Y.finalized = !0, (Ci = _t.litElementHydrateSupport) == null || Ci.call(_t, { LitElement: Y });
const ke = _t.litElementPolyfillSupport;
ke == null || ke({ LitElement: Y });
(_t.litElementVersions ?? (_t.litElementVersions = [])).push("4.2.1");
const Gt = Tt`
  :host {
    /* HA theme variables with fallbacks */
    --primary-color: var(--primary-color, #03a9f4);
    --primary-text-color: var(--primary-text-color, #212121);
    --secondary-text-color: var(--secondary-text-color, #757575);
    --divider-color: var(--divider-color, #e0e0e0);
    --card-background-color: var(--card-background-color, #ffffff);
    --secondary-background-color: var(--secondary-background-color, #f5f5f5);
    --disabled-text-color: var(--disabled-text-color, #9e9e9e);
    --success-color: var(--success-color, #4caf50);
    --error-color: var(--error-color, #f44336);
    --warning-color: var(--warning-color, #ff9800);

    /* Aliases for compatibility */
    --text-primary-color: var(--primary-text-color, #212121);
    --text-secondary-color: var(--secondary-text-color, #757575);
    --disabled-color: var(--disabled-text-color, #9e9e9e);

    /* RGB variants for rgba() usage */
    --rgb-primary-color: 3, 169, 244;
    --rgb-error-color: 244, 67, 54;
    --rgb-warning-color: 255, 152, 0;
    --rgb-success-color: 76, 175, 80;

    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    --border-radius: 4px;
    --transition-speed: 0.2s;
  }

  * {
    box-sizing: border-box;
  }

  .card {
    background: var(--card-background-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-md);
  }

  .section-header {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    letter-spacing: 0.5px;
  }

  .divider {
    height: 1px;
    background: var(--divider-color);
    margin: var(--spacing-md) 0;
  }

  .button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed);
  }

  .button-primary {
    background: var(--primary-color, #03a9f4);
    color: white !important;
    border: none;
  }

  .button-primary:hover {
    opacity: 0.9;
  }

  .button-secondary {
    background: transparent;
    color: var(--primary-color, #03a9f4) !important;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .button-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  [data-theme="dark"] .button-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .icon-button {
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary-color);
    border-radius: var(--border-radius);
    transition: all var(--transition-speed);
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary-color);
  }

  .text-muted {
    color: var(--text-secondary-color);
    font-size: 12px;
  }

  .error-text {
    color: var(--error-color);
    font-size: 12px;
    margin-top: var(--spacing-xs);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state-icon {
    --mdc-icon-size: 48px;
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: var(--spacing-md);
  }

  .empty-state-message {
    margin-bottom: var(--spacing-md);
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-state-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: inherit;
  }
`;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Mo = { CHILD: 2 }, Po = (n) => (...t) => ({ _$litDirective$: n, values: t });
class No {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, i) {
    this._$Ct = t, this._$AM = e, this._$Ci = i;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Ro } = Io, fi = () => document.createComment(""), Nt = (n, t, e) => {
  var a;
  const i = n._$AA.parentNode, o = t === void 0 ? n._$AB : t._$AA;
  if (e === void 0) {
    const r = i.insertBefore(fi(), o), s = i.insertBefore(fi(), o);
    e = new Ro(r, s, n, n.options);
  } else {
    const r = e._$AB.nextSibling, s = e._$AM, c = s !== n;
    if (c) {
      let l;
      (a = e._$AQ) == null || a.call(e, n), e._$AM = n, e._$AP !== void 0 && (l = n._$AU) !== s._$AU && e._$AP(l);
    }
    if (r !== o || c) {
      let l = e._$AA;
      for (; l !== r; ) {
        const u = l.nextSibling;
        i.insertBefore(l, o), l = u;
      }
    }
  }
  return e;
}, ht = (n, t, e = n) => (n._$AI(t, e), n), Fo = {}, Bo = (n, t = Fo) => n._$AH = t, zo = (n) => n._$AH, Te = (n) => {
  n._$AR(), n._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const gi = (n, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let o = t; o <= e; o++) i.set(n[o], o);
  return i;
}, Ho = Po(class extends No {
  constructor(n) {
    if (super(n), n.type !== Mo.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(n, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const o = [], a = [];
    let r = 0;
    for (const s of n) o[r] = i ? i(s, r) : r, a[r] = e(s, r), r++;
    return { values: a, keys: o };
  }
  render(n, t, e) {
    return this.dt(n, t, e).values;
  }
  update(n, [t, e, i]) {
    const o = zo(n), { values: a, keys: r } = this.dt(t, e, i);
    if (!Array.isArray(o)) return this.ut = r, a;
    const s = this.ut ?? (this.ut = []), c = [];
    let l, u, d = 0, h = o.length - 1, p = 0, f = a.length - 1;
    for (; d <= h && p <= f; ) if (o[d] === null) d++;
    else if (o[h] === null) h--;
    else if (s[d] === r[p]) c[p] = ht(o[d], a[p]), d++, p++;
    else if (s[h] === r[f]) c[f] = ht(o[h], a[f]), h--, f--;
    else if (s[d] === r[f]) c[f] = ht(o[d], a[f]), Nt(n, c[f + 1], o[d]), d++, f--;
    else if (s[h] === r[p]) c[p] = ht(o[h], a[p]), Nt(n, o[d], o[h]), h--, p++;
    else if (l === void 0 && (l = gi(r, p, f), u = gi(s, d, h)), l.has(s[d])) if (l.has(s[h])) {
      const _ = u.get(r[p]), v = _ !== void 0 ? o[_] : null;
      if (v === null) {
        const E = Nt(n, o[d]);
        ht(E, a[p]), c[p] = E;
      } else c[p] = ht(v, a[p]), Nt(n, o[d], v), o[_] = null;
      p++;
    } else Te(o[h]), h--;
    else Te(o[d]), d++;
    for (; p <= f; ) {
      const _ = Nt(n, c[f + 1]);
      ht(_, a[p]), c[p++] = _;
    }
    for (; d <= h; ) {
      const _ = o[d++];
      _ !== null && Te(_);
    }
    return this.ut = r, Bo(n, c), yt;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function mi(n, t) {
  var e = Object.keys(n);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(n);
    t && (i = i.filter(function(o) {
      return Object.getOwnPropertyDescriptor(n, o).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function j(n) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? mi(Object(e), !0).forEach(function(i) {
      Uo(n, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(n, Object.getOwnPropertyDescriptors(e)) : mi(Object(e)).forEach(function(i) {
      Object.defineProperty(n, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return n;
}
function ae(n) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? ae = function(t) {
    return typeof t;
  } : ae = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ae(n);
}
function Uo(n, t, e) {
  return t in n ? Object.defineProperty(n, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : n[t] = e, n;
}
function J() {
  return J = Object.assign || function(n) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (n[i] = e[i]);
    }
    return n;
  }, J.apply(this, arguments);
}
function Wo(n, t) {
  if (n == null) return {};
  var e = {}, i = Object.keys(n), o, a;
  for (a = 0; a < i.length; a++)
    o = i[a], !(t.indexOf(o) >= 0) && (e[o] = n[o]);
  return e;
}
function qo(n, t) {
  if (n == null) return {};
  var e = Wo(n, t), i, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(n);
    for (o = 0; o < a.length; o++)
      i = a[o], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(n, i) && (e[i] = n[i]);
  }
  return e;
}
var Vo = "1.15.6";
function G(n) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(n);
}
var Q = G(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Jt = G(/Edge/i), _i = G(/firefox/i), Ut = G(/safari/i) && !G(/chrome/i) && !G(/android/i), Qe = G(/iP(ad|od|hone)/i), Wi = G(/chrome/i) && G(/android/i), qi = {
  capture: !1,
  passive: !1
};
function S(n, t, e) {
  n.addEventListener(t, e, !Q && qi);
}
function x(n, t, e) {
  n.removeEventListener(t, e, !Q && qi);
}
function pe(n, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), n)
      try {
        if (n.matches)
          return n.matches(t);
        if (n.msMatchesSelector)
          return n.msMatchesSelector(t);
        if (n.webkitMatchesSelector)
          return n.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function Vi(n) {
  return n.host && n !== document && n.host.nodeType ? n.host : n.parentNode;
}
function q(n, t, e, i) {
  if (n) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? n.parentNode === e && pe(n, t) : pe(n, t)) || i && n === e)
        return n;
      if (n === e) break;
    } while (n = Vi(n));
  }
  return null;
}
var vi = /\s+/g;
function z(n, t, e) {
  if (n && t)
    if (n.classList)
      n.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + n.className + " ").replace(vi, " ").replace(" " + t + " ", " ");
      n.className = (i + (e ? " " + t : "")).replace(vi, " ");
    }
}
function y(n, t, e) {
  var i = n && n.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(n, "") : n.currentStyle && (e = n.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function Et(n, t) {
  var e = "";
  if (typeof n == "string")
    e = n;
  else
    do {
      var i = y(n, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (n = n.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(e);
}
function Ki(n, t, e) {
  if (n) {
    var i = n.getElementsByTagName(t), o = 0, a = i.length;
    if (e)
      for (; o < a; o++)
        e(i[o], o);
    return i;
  }
  return [];
}
function K() {
  var n = document.scrollingElement;
  return n || document.documentElement;
}
function L(n, t, e, i, o) {
  if (!(!n.getBoundingClientRect && n !== window)) {
    var a, r, s, c, l, u, d;
    if (n !== window && n.parentNode && n !== K() ? (a = n.getBoundingClientRect(), r = a.top, s = a.left, c = a.bottom, l = a.right, u = a.height, d = a.width) : (r = 0, s = 0, c = window.innerHeight, l = window.innerWidth, u = window.innerHeight, d = window.innerWidth), (t || e) && n !== window && (o = o || n.parentNode, !Q))
      do
        if (o && o.getBoundingClientRect && (y(o, "transform") !== "none" || e && y(o, "position") !== "static")) {
          var h = o.getBoundingClientRect();
          r -= h.top + parseInt(y(o, "border-top-width")), s -= h.left + parseInt(y(o, "border-left-width")), c = r + a.height, l = s + a.width;
          break;
        }
      while (o = o.parentNode);
    if (i && n !== window) {
      var p = Et(o || n), f = p && p.a, _ = p && p.d;
      p && (r /= _, s /= f, d /= f, u /= _, c = r + u, l = s + d);
    }
    return {
      top: r,
      left: s,
      bottom: c,
      right: l,
      width: d,
      height: u
    };
  }
}
function yi(n, t, e) {
  for (var i = at(n, !0), o = L(n)[t]; i; ) {
    var a = L(i)[e], r = void 0;
    if (r = o >= a, !r) return i;
    if (i === K()) break;
    i = at(i, !1);
  }
  return !1;
}
function kt(n, t, e, i) {
  for (var o = 0, a = 0, r = n.children; a < r.length; ) {
    if (r[a].style.display !== "none" && r[a] !== b.ghost && (i || r[a] !== b.dragged) && q(r[a], e.draggable, n, !1)) {
      if (o === t)
        return r[a];
      o++;
    }
    a++;
  }
  return null;
}
function Ze(n, t) {
  for (var e = n.lastElementChild; e && (e === b.ghost || y(e, "display") === "none" || t && !pe(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function U(n, t) {
  var e = 0;
  if (!n || !n.parentNode)
    return -1;
  for (; n = n.previousElementSibling; )
    n.nodeName.toUpperCase() !== "TEMPLATE" && n !== b.clone && (!t || pe(n, t)) && e++;
  return e;
}
function bi(n) {
  var t = 0, e = 0, i = K();
  if (n)
    do {
      var o = Et(n), a = o.a, r = o.d;
      t += n.scrollLeft * a, e += n.scrollTop * r;
    } while (n !== i && (n = n.parentNode));
  return [t, e];
}
function Ko(n, t) {
  for (var e in n)
    if (n.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === n[e][i]) return Number(e);
    }
  return -1;
}
function at(n, t) {
  if (!n || !n.getBoundingClientRect) return K();
  var e = n, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var o = y(e);
      if (e.clientWidth < e.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return K();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return K();
}
function jo(n, t) {
  if (n && t)
    for (var e in t)
      t.hasOwnProperty(e) && (n[e] = t[e]);
  return n;
}
function De(n, t) {
  return Math.round(n.top) === Math.round(t.top) && Math.round(n.left) === Math.round(t.left) && Math.round(n.height) === Math.round(t.height) && Math.round(n.width) === Math.round(t.width);
}
var Wt;
function ji(n, t) {
  return function() {
    if (!Wt) {
      var e = arguments, i = this;
      e.length === 1 ? n.call(i, e[0]) : n.apply(i, e), Wt = setTimeout(function() {
        Wt = void 0;
      }, t);
    }
  };
}
function Xo() {
  clearTimeout(Wt), Wt = void 0;
}
function Xi(n, t, e) {
  n.scrollLeft += t, n.scrollTop += e;
}
function Yi(n) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(n).cloneNode(!0) : e ? e(n).clone(!0)[0] : n.cloneNode(!0);
}
function Gi(n, t, e) {
  var i = {};
  return Array.from(n.children).forEach(function(o) {
    var a, r, s, c;
    if (!(!q(o, t.draggable, n, !1) || o.animated || o === e)) {
      var l = L(o);
      i.left = Math.min((a = i.left) !== null && a !== void 0 ? a : 1 / 0, l.left), i.top = Math.min((r = i.top) !== null && r !== void 0 ? r : 1 / 0, l.top), i.right = Math.max((s = i.right) !== null && s !== void 0 ? s : -1 / 0, l.right), i.bottom = Math.max((c = i.bottom) !== null && c !== void 0 ? c : -1 / 0, l.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var F = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function Yo() {
  var n = [], t;
  return {
    captureAnimationState: function() {
      if (n = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(o) {
          if (!(y(o, "display") === "none" || o === b.ghost)) {
            n.push({
              target: o,
              rect: L(o)
            });
            var a = j({}, n[n.length - 1].rect);
            if (o.thisAnimationDuration) {
              var r = Et(o, !0);
              r && (a.top -= r.f, a.left -= r.e);
            }
            o.fromRect = a;
          }
        });
      }
    },
    addAnimationState: function(i) {
      n.push(i);
    },
    removeAnimationState: function(i) {
      n.splice(Ko(n, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(t), typeof i == "function" && i();
        return;
      }
      var a = !1, r = 0;
      n.forEach(function(s) {
        var c = 0, l = s.target, u = l.fromRect, d = L(l), h = l.prevFromRect, p = l.prevToRect, f = s.rect, _ = Et(l, !0);
        _ && (d.top -= _.f, d.left -= _.e), l.toRect = d, l.thisAnimationDuration && De(h, d) && !De(u, d) && // Make sure animatingRect is on line between toRect & fromRect
        (f.top - d.top) / (f.left - d.left) === (u.top - d.top) / (u.left - d.left) && (c = Jo(f, h, p, o.options)), De(d, u) || (l.prevFromRect = u, l.prevToRect = d, c || (c = o.options.animation), o.animate(l, f, d, c)), c && (a = !0, r = Math.max(r, c), clearTimeout(l.animationResetTimer), l.animationResetTimer = setTimeout(function() {
          l.animationTime = 0, l.prevFromRect = null, l.fromRect = null, l.prevToRect = null, l.thisAnimationDuration = null;
        }, c), l.thisAnimationDuration = c);
      }), clearTimeout(t), a ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, r) : typeof i == "function" && i(), n = [];
    },
    animate: function(i, o, a, r) {
      if (r) {
        y(i, "transition", ""), y(i, "transform", "");
        var s = Et(this.el), c = s && s.a, l = s && s.d, u = (o.left - a.left) / (c || 1), d = (o.top - a.top) / (l || 1);
        i.animatingX = !!u, i.animatingY = !!d, y(i, "transform", "translate3d(" + u + "px," + d + "px,0)"), this.forRepaintDummy = Go(i), y(i, "transition", "transform " + r + "ms" + (this.options.easing ? " " + this.options.easing : "")), y(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          y(i, "transition", ""), y(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, r);
      }
    }
  };
}
function Go(n) {
  return n.offsetWidth;
}
function Jo(n, t, e, i) {
  return Math.sqrt(Math.pow(t.top - n.top, 2) + Math.pow(t.left - n.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var bt = [], Ce = {
  initializeByDefault: !0
}, Qt = {
  mount: function(t) {
    for (var e in Ce)
      Ce.hasOwnProperty(e) && !(e in t) && (t[e] = Ce[e]);
    bt.forEach(function(i) {
      if (i.pluginName === t.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(t.pluginName, " more than once");
    }), bt.push(t);
  },
  pluginEvent: function(t, e, i) {
    var o = this;
    this.eventCanceled = !1, i.cancel = function() {
      o.eventCanceled = !0;
    };
    var a = t + "Global";
    bt.forEach(function(r) {
      e[r.pluginName] && (e[r.pluginName][a] && e[r.pluginName][a](j({
        sortable: e
      }, i)), e.options[r.pluginName] && e[r.pluginName][t] && e[r.pluginName][t](j({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, o) {
    bt.forEach(function(s) {
      var c = s.pluginName;
      if (!(!t.options[c] && !s.initializeByDefault)) {
        var l = new s(t, e, t.options);
        l.sortable = t, l.options = t.options, t[c] = l, J(i, l.defaults);
      }
    });
    for (var a in t.options)
      if (t.options.hasOwnProperty(a)) {
        var r = this.modifyOption(t, a, t.options[a]);
        typeof r < "u" && (t.options[a] = r);
      }
  },
  getEventProperties: function(t, e) {
    var i = {};
    return bt.forEach(function(o) {
      typeof o.eventProperties == "function" && J(i, o.eventProperties.call(e[o.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var o;
    return bt.forEach(function(a) {
      t[a.pluginName] && a.optionListeners && typeof a.optionListeners[e] == "function" && (o = a.optionListeners[e].call(t[a.pluginName], i));
    }), o;
  }
};
function Qo(n) {
  var t = n.sortable, e = n.rootEl, i = n.name, o = n.targetEl, a = n.cloneEl, r = n.toEl, s = n.fromEl, c = n.oldIndex, l = n.newIndex, u = n.oldDraggableIndex, d = n.newDraggableIndex, h = n.originalEvent, p = n.putSortable, f = n.extraEventProperties;
  if (t = t || e && e[F], !!t) {
    var _, v = t.options, E = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !Q && !Jt ? _ = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (_ = document.createEvent("Event"), _.initEvent(i, !0, !0)), _.to = r || e, _.from = s || e, _.item = o || e, _.clone = a, _.oldIndex = c, _.newIndex = l, _.oldDraggableIndex = u, _.newDraggableIndex = d, _.originalEvent = h, _.pullMode = p ? p.lastPutMode : void 0;
    var A = j(j({}, f), Qt.getEventProperties(i, t));
    for (var I in A)
      _[I] = A[I];
    e && e.dispatchEvent(_), v[E] && v[E].call(t, _);
  }
}
var Zo = ["evt"], R = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = i.evt, a = qo(i, Zo);
  Qt.pluginEvent.bind(b)(t, e, j({
    dragEl: g,
    parentEl: D,
    ghostEl: w,
    rootEl: k,
    nextEl: gt,
    lastDownEl: re,
    cloneEl: T,
    cloneHidden: ot,
    dragStarted: Rt,
    putSortable: M,
    activeSortable: b.active,
    originalEvent: o,
    oldIndex: $t,
    oldDraggableIndex: qt,
    newIndex: H,
    newDraggableIndex: et,
    hideGhostForTarget: to,
    unhideGhostForTarget: eo,
    cloneNowHidden: function() {
      ot = !0;
    },
    cloneNowShown: function() {
      ot = !1;
    },
    dispatchSortableEvent: function(s) {
      N({
        sortable: e,
        name: s,
        originalEvent: o
      });
    }
  }, a));
};
function N(n) {
  Qo(j({
    putSortable: M,
    cloneEl: T,
    targetEl: g,
    rootEl: k,
    oldIndex: $t,
    oldDraggableIndex: qt,
    newIndex: H,
    newDraggableIndex: et
  }, n));
}
var g, D, w, k, gt, re, T, ot, $t, H, qt, et, te, M, St = !1, fe = !1, ge = [], pt, W, Le, Ie, wi, xi, Rt, wt, Vt, Kt = !1, ee = !1, se, P, Oe = [], Be = !1, me = [], Se = typeof document < "u", ie = Qe, Si = Jt || Q ? "cssFloat" : "float", tn = Se && !Wi && !Qe && "draggable" in document.createElement("div"), Ji = function() {
  if (Se) {
    if (Q)
      return !1;
    var n = document.createElement("x");
    return n.style.cssText = "pointer-events:auto", n.style.pointerEvents === "auto";
  }
}(), Qi = function(t, e) {
  var i = y(t), o = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), a = kt(t, 0, e), r = kt(t, 1, e), s = a && y(a), c = r && y(r), l = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + L(a).width, u = c && parseInt(c.marginLeft) + parseInt(c.marginRight) + L(r).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (a && s.float && s.float !== "none") {
    var d = s.float === "left" ? "left" : "right";
    return r && (c.clear === "both" || c.clear === d) ? "vertical" : "horizontal";
  }
  return a && (s.display === "block" || s.display === "flex" || s.display === "table" || s.display === "grid" || l >= o && i[Si] === "none" || r && i[Si] === "none" && l + u > o) ? "vertical" : "horizontal";
}, en = function(t, e, i) {
  var o = i ? t.left : t.top, a = i ? t.right : t.bottom, r = i ? t.width : t.height, s = i ? e.left : e.top, c = i ? e.right : e.bottom, l = i ? e.width : e.height;
  return o === s || a === c || o + r / 2 === s + l / 2;
}, on = function(t, e) {
  var i;
  return ge.some(function(o) {
    var a = o[F].options.emptyInsertThreshold;
    if (!(!a || Ze(o))) {
      var r = L(o), s = t >= r.left - a && t <= r.right + a, c = e >= r.top - a && e <= r.bottom + a;
      if (s && c)
        return i = o;
    }
  }), i;
}, Zi = function(t) {
  function e(a, r) {
    return function(s, c, l, u) {
      var d = s.options.group.name && c.options.group.name && s.options.group.name === c.options.group.name;
      if (a == null && (r || d))
        return !0;
      if (a == null || a === !1)
        return !1;
      if (r && a === "clone")
        return a;
      if (typeof a == "function")
        return e(a(s, c, l, u), r)(s, c, l, u);
      var h = (r ? s : c).options.group.name;
      return a === !0 || typeof a == "string" && a === h || a.join && a.indexOf(h) > -1;
    };
  }
  var i = {}, o = t.group;
  (!o || ae(o) != "object") && (o = {
    name: o
  }), i.name = o.name, i.checkPull = e(o.pull, !0), i.checkPut = e(o.put), i.revertClone = o.revertClone, t.group = i;
}, to = function() {
  !Ji && w && y(w, "display", "none");
}, eo = function() {
  !Ji && w && y(w, "display", "");
};
Se && !Wi && document.addEventListener("click", function(n) {
  if (fe)
    return n.preventDefault(), n.stopPropagation && n.stopPropagation(), n.stopImmediatePropagation && n.stopImmediatePropagation(), fe = !1, !1;
}, !0);
var ft = function(t) {
  if (g) {
    t = t.touches ? t.touches[0] : t;
    var e = on(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var o in t)
        t.hasOwnProperty(o) && (i[o] = t[o]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[F]._onDragOver(i);
    }
  }
}, nn = function(t) {
  g && g.parentNode[F]._isOutsideThisEl(t.target);
};
function b(n, t) {
  if (!(n && n.nodeType && n.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(n));
  this.el = n, this.options = t = J({}, t), n[F] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(n.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return Qi(n, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(r, s) {
      r.setData("Text", s.textContent);
    },
    dropBubble: !1,
    dragoverBubble: !1,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: !1,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: !1,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: !1,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    // Disabled on Safari: #1571; Enabled on Safari IOS: #2244
    supportPointer: b.supportPointer !== !1 && "PointerEvent" in window && (!Ut || Qe),
    emptyInsertThreshold: 5
  };
  Qt.initializePlugins(this, n, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  Zi(t);
  for (var o in this)
    o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : tn, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? S(n, "pointerdown", this._onTapStart) : (S(n, "mousedown", this._onTapStart), S(n, "touchstart", this._onTapStart)), this.nativeDraggable && (S(n, "dragover", this), S(n, "dragenter", this)), ge.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), J(this, Yo());
}
b.prototype = /** @lends Sortable.prototype */
{
  constructor: b,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && (wt = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, g) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, o = this.options, a = o.preventOnFilter, r = t.type, s = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, c = (s || t).target, l = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || c, u = o.filter;
      if (hn(i), !g && !(/mousedown|pointerdown/.test(r) && t.button !== 0 || o.disabled) && !l.isContentEditable && !(!this.nativeDraggable && Ut && c && c.tagName.toUpperCase() === "SELECT") && (c = q(c, o.draggable, i, !1), !(c && c.animated) && re !== c)) {
        if ($t = U(c), qt = U(c, o.draggable), typeof u == "function") {
          if (u.call(this, t, c, this)) {
            N({
              sortable: e,
              rootEl: l,
              name: "filter",
              targetEl: c,
              toEl: i,
              fromEl: i
            }), R("filter", e, {
              evt: t
            }), a && t.preventDefault();
            return;
          }
        } else if (u && (u = u.split(",").some(function(d) {
          if (d = q(l, d.trim(), i, !1), d)
            return N({
              sortable: e,
              rootEl: d,
              name: "filter",
              targetEl: c,
              fromEl: i,
              toEl: i
            }), R("filter", e, {
              evt: t
            }), !0;
        }), u)) {
          a && t.preventDefault();
          return;
        }
        o.handle && !q(l, o.handle, i, !1) || this._prepareDragStart(t, s, c);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var o = this, a = o.el, r = o.options, s = a.ownerDocument, c;
    if (i && !g && i.parentNode === a) {
      var l = L(i);
      if (k = a, g = i, D = g.parentNode, gt = g.nextSibling, re = i, te = r.group, b.dragged = g, pt = {
        target: g,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, wi = pt.clientX - l.left, xi = pt.clientY - l.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, g.style["will-change"] = "all", c = function() {
        if (R("delayEnded", o, {
          evt: t
        }), b.eventCanceled) {
          o._onDrop();
          return;
        }
        o._disableDelayedDragEvents(), !_i && o.nativeDraggable && (g.draggable = !0), o._triggerDragStart(t, e), N({
          sortable: o,
          name: "choose",
          originalEvent: t
        }), z(g, r.chosenClass, !0);
      }, r.ignore.split(",").forEach(function(u) {
        Ki(g, u.trim(), Me);
      }), S(s, "dragover", ft), S(s, "mousemove", ft), S(s, "touchmove", ft), r.supportPointer ? (S(s, "pointerup", o._onDrop), !this.nativeDraggable && S(s, "pointercancel", o._onDrop)) : (S(s, "mouseup", o._onDrop), S(s, "touchend", o._onDrop), S(s, "touchcancel", o._onDrop)), _i && this.nativeDraggable && (this.options.touchStartThreshold = 4, g.draggable = !0), R("delayStart", this, {
        evt: t
      }), r.delay && (!r.delayOnTouchOnly || e) && (!this.nativeDraggable || !(Jt || Q))) {
        if (b.eventCanceled) {
          this._onDrop();
          return;
        }
        r.supportPointer ? (S(s, "pointerup", o._disableDelayedDrag), S(s, "pointercancel", o._disableDelayedDrag)) : (S(s, "mouseup", o._disableDelayedDrag), S(s, "touchend", o._disableDelayedDrag), S(s, "touchcancel", o._disableDelayedDrag)), S(s, "mousemove", o._delayedDragTouchMoveHandler), S(s, "touchmove", o._delayedDragTouchMoveHandler), r.supportPointer && S(s, "pointermove", o._delayedDragTouchMoveHandler), o._dragStartTimer = setTimeout(c, r.delay);
      } else
        c();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    g && Me(g), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    x(t, "mouseup", this._disableDelayedDrag), x(t, "touchend", this._disableDelayedDrag), x(t, "touchcancel", this._disableDelayedDrag), x(t, "pointerup", this._disableDelayedDrag), x(t, "pointercancel", this._disableDelayedDrag), x(t, "mousemove", this._delayedDragTouchMoveHandler), x(t, "touchmove", this._delayedDragTouchMoveHandler), x(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? S(document, "pointermove", this._onTouchMove) : e ? S(document, "touchmove", this._onTouchMove) : S(document, "mousemove", this._onTouchMove) : (S(g, "dragend", this), S(k, "dragstart", this._onDragStart));
    try {
      document.selection ? ce(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if (St = !1, k && g) {
      R("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && S(document, "dragover", nn);
      var i = this.options;
      !t && z(g, i.dragClass, !1), z(g, i.ghostClass, !0), b.active = this, t && this._appendGhost(), N({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (W) {
      this._lastX = W.clientX, this._lastY = W.clientY, to();
      for (var t = document.elementFromPoint(W.clientX, W.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(W.clientX, W.clientY), t !== e); )
        e = t;
      if (g.parentNode[F]._isOutsideThisEl(t), e)
        do {
          if (e[F]) {
            var i = void 0;
            if (i = e[F]._onDragOver({
              clientX: W.clientX,
              clientY: W.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = Vi(e));
      eo();
    }
  },
  _onTouchMove: function(t) {
    if (pt) {
      var e = this.options, i = e.fallbackTolerance, o = e.fallbackOffset, a = t.touches ? t.touches[0] : t, r = w && Et(w, !0), s = w && r && r.a, c = w && r && r.d, l = ie && P && bi(P), u = (a.clientX - pt.clientX + o.x) / (s || 1) + (l ? l[0] - Oe[0] : 0) / (s || 1), d = (a.clientY - pt.clientY + o.y) / (c || 1) + (l ? l[1] - Oe[1] : 0) / (c || 1);
      if (!b.active && !St) {
        if (i && Math.max(Math.abs(a.clientX - this._lastX), Math.abs(a.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (w) {
        r ? (r.e += u - (Le || 0), r.f += d - (Ie || 0)) : r = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: u,
          f: d
        };
        var h = "matrix(".concat(r.a, ",").concat(r.b, ",").concat(r.c, ",").concat(r.d, ",").concat(r.e, ",").concat(r.f, ")");
        y(w, "webkitTransform", h), y(w, "mozTransform", h), y(w, "msTransform", h), y(w, "transform", h), Le = u, Ie = d, W = a;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!w) {
      var t = this.options.fallbackOnBody ? document.body : k, e = L(g, !0, ie, !0, t), i = this.options;
      if (ie) {
        for (P = t; y(P, "position") === "static" && y(P, "transform") === "none" && P !== document; )
          P = P.parentNode;
        P !== document.body && P !== document.documentElement ? (P === document && (P = K()), e.top += P.scrollTop, e.left += P.scrollLeft) : P = K(), Oe = bi(P);
      }
      w = g.cloneNode(!0), z(w, i.ghostClass, !1), z(w, i.fallbackClass, !0), z(w, i.dragClass, !0), y(w, "transition", ""), y(w, "transform", ""), y(w, "box-sizing", "border-box"), y(w, "margin", 0), y(w, "top", e.top), y(w, "left", e.left), y(w, "width", e.width), y(w, "height", e.height), y(w, "opacity", "0.8"), y(w, "position", ie ? "absolute" : "fixed"), y(w, "zIndex", "100000"), y(w, "pointerEvents", "none"), b.ghost = w, t.appendChild(w), y(w, "transform-origin", wi / parseInt(w.style.width) * 100 + "% " + xi / parseInt(w.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, o = t.dataTransfer, a = i.options;
    if (R("dragStart", this, {
      evt: t
    }), b.eventCanceled) {
      this._onDrop();
      return;
    }
    R("setupClone", this), b.eventCanceled || (T = Yi(g), T.removeAttribute("id"), T.draggable = !1, T.style["will-change"] = "", this._hideClone(), z(T, this.options.chosenClass, !1), b.clone = T), i.cloneId = ce(function() {
      R("clone", i), !b.eventCanceled && (i.options.removeCloneOnHide || k.insertBefore(T, g), i._hideClone(), N({
        sortable: i,
        name: "clone"
      }));
    }), !e && z(g, a.dragClass, !0), e ? (fe = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (x(document, "mouseup", i._onDrop), x(document, "touchend", i._onDrop), x(document, "touchcancel", i._onDrop), o && (o.effectAllowed = "move", a.setData && a.setData.call(i, o, g)), S(document, "drop", i), y(g, "transform", "translateZ(0)")), St = !0, i._dragStartId = ce(i._dragStarted.bind(i, e, t)), S(document, "selectstart", i), Rt = !0, window.getSelection().removeAllRanges(), Ut && y(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, o, a, r, s = this.options, c = s.group, l = b.active, u = te === c, d = s.sort, h = M || l, p, f = this, _ = !1;
    if (Be) return;
    function v(Mt, ho) {
      R(Mt, f, j({
        evt: t,
        isOwner: u,
        axis: p ? "vertical" : "horizontal",
        revert: r,
        dragRect: o,
        targetRect: a,
        canSort: d,
        fromSortable: h,
        target: i,
        completed: A,
        onMove: function(oi, po) {
          return oe(k, e, g, o, oi, L(oi), t, po);
        },
        changed: I
      }, ho));
    }
    function E() {
      v("dragOverAnimationCapture"), f.captureAnimationState(), f !== h && h.captureAnimationState();
    }
    function A(Mt) {
      return v("dragOverCompleted", {
        insertion: Mt
      }), Mt && (u ? l._hideClone() : l._showClone(f), f !== h && (z(g, M ? M.options.ghostClass : l.options.ghostClass, !1), z(g, s.ghostClass, !0)), M !== f && f !== b.active ? M = f : f === b.active && M && (M = null), h === f && (f._ignoreWhileAnimating = i), f.animateAll(function() {
        v("dragOverAnimationComplete"), f._ignoreWhileAnimating = null;
      }), f !== h && (h.animateAll(), h._ignoreWhileAnimating = null)), (i === g && !g.animated || i === e && !i.animated) && (wt = null), !s.dragoverBubble && !t.rootEl && i !== document && (g.parentNode[F]._isOutsideThisEl(t.target), !Mt && ft(t)), !s.dragoverBubble && t.stopPropagation && t.stopPropagation(), _ = !0;
    }
    function I() {
      H = U(g), et = U(g, s.draggable), N({
        sortable: f,
        name: "change",
        toEl: e,
        newIndex: H,
        newDraggableIndex: et,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = q(i, s.draggable, e, !0), v("dragOver"), b.eventCanceled) return _;
    if (g.contains(t.target) || i.animated && i.animatingX && i.animatingY || f._ignoreWhileAnimating === i)
      return A(!1);
    if (fe = !1, l && !s.disabled && (u ? d || (r = D !== k) : M === this || (this.lastPutMode = te.checkPull(this, l, g, t)) && c.checkPut(this, l, g, t))) {
      if (p = this._getDirection(t, i) === "vertical", o = L(g), v("dragOverValid"), b.eventCanceled) return _;
      if (r)
        return D = k, E(), this._hideClone(), v("revert"), b.eventCanceled || (gt ? k.insertBefore(g, gt) : k.appendChild(g)), A(!0);
      var $ = Ze(e, s.draggable);
      if (!$ || cn(t, p, this) && !$.animated) {
        if ($ === g)
          return A(!1);
        if ($ && e === t.target && (i = $), i && (a = L(i)), oe(k, e, g, o, i, a, t, !!i) !== !1)
          return E(), $ && $.nextSibling ? e.insertBefore(g, $.nextSibling) : e.appendChild(g), D = e, I(), A(!0);
      } else if ($ && sn(t, p, this)) {
        var ct = kt(e, 0, s, !0);
        if (ct === g)
          return A(!1);
        if (i = ct, a = L(i), oe(k, e, g, o, i, a, t, !1) !== !1)
          return E(), e.insertBefore(g, ct), D = e, I(), A(!0);
      } else if (i.parentNode === e) {
        a = L(i);
        var V = 0, lt, Ct = g.parentNode !== e, B = !en(g.animated && g.toRect || o, i.animated && i.toRect || a, p), Lt = p ? "top" : "left", Z = yi(i, "top", "top") || yi(g, "top", "top"), It = Z ? Z.scrollTop : void 0;
        wt !== i && (lt = a[Lt], Kt = !1, ee = !B && s.invertSwap || Ct), V = ln(t, i, a, p, B ? 1 : s.swapThreshold, s.invertedSwapThreshold == null ? s.swapThreshold : s.invertedSwapThreshold, ee, wt === i);
        var X;
        if (V !== 0) {
          var dt = U(g);
          do
            dt -= V, X = D.children[dt];
          while (X && (y(X, "display") === "none" || X === w));
        }
        if (V === 0 || X === i)
          return A(!1);
        wt = i, Vt = V;
        var Ot = i.nextElementSibling, tt = !1;
        tt = V === 1;
        var Zt = oe(k, e, g, o, i, a, t, tt);
        if (Zt !== !1)
          return (Zt === 1 || Zt === -1) && (tt = Zt === 1), Be = !0, setTimeout(rn, 30), E(), tt && !Ot ? e.appendChild(g) : i.parentNode.insertBefore(g, tt ? Ot : i), Z && Xi(Z, 0, It - Z.scrollTop), D = g.parentNode, lt !== void 0 && !ee && (se = Math.abs(lt - L(i)[Lt])), I(), A(!0);
      }
      if (e.contains(g))
        return A(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    x(document, "mousemove", this._onTouchMove), x(document, "touchmove", this._onTouchMove), x(document, "pointermove", this._onTouchMove), x(document, "dragover", ft), x(document, "mousemove", ft), x(document, "touchmove", ft);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    x(t, "mouseup", this._onDrop), x(t, "touchend", this._onDrop), x(t, "pointerup", this._onDrop), x(t, "pointercancel", this._onDrop), x(t, "touchcancel", this._onDrop), x(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (H = U(g), et = U(g, i.draggable), R("drop", this, {
      evt: t
    }), D = g && g.parentNode, H = U(g), et = U(g, i.draggable), b.eventCanceled) {
      this._nulling();
      return;
    }
    St = !1, ee = !1, Kt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), ze(this.cloneId), ze(this._dragStartId), this.nativeDraggable && (x(document, "drop", this), x(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Ut && y(document.body, "user-select", ""), y(g, "transform", ""), t && (Rt && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), w && w.parentNode && w.parentNode.removeChild(w), (k === D || M && M.lastPutMode !== "clone") && T && T.parentNode && T.parentNode.removeChild(T), g && (this.nativeDraggable && x(g, "dragend", this), Me(g), g.style["will-change"] = "", Rt && !St && z(g, M ? M.options.ghostClass : this.options.ghostClass, !1), z(g, this.options.chosenClass, !1), N({
      sortable: this,
      name: "unchoose",
      toEl: D,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), k !== D ? (H >= 0 && (N({
      rootEl: D,
      name: "add",
      toEl: D,
      fromEl: k,
      originalEvent: t
    }), N({
      sortable: this,
      name: "remove",
      toEl: D,
      originalEvent: t
    }), N({
      rootEl: D,
      name: "sort",
      toEl: D,
      fromEl: k,
      originalEvent: t
    }), N({
      sortable: this,
      name: "sort",
      toEl: D,
      originalEvent: t
    })), M && M.save()) : H !== $t && H >= 0 && (N({
      sortable: this,
      name: "update",
      toEl: D,
      originalEvent: t
    }), N({
      sortable: this,
      name: "sort",
      toEl: D,
      originalEvent: t
    })), b.active && ((H == null || H === -1) && (H = $t, et = qt), N({
      sortable: this,
      name: "end",
      toEl: D,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    R("nulling", this), k = g = D = w = gt = T = re = ot = pt = W = Rt = H = et = $t = qt = wt = Vt = M = te = b.dragged = b.ghost = b.clone = b.active = null, me.forEach(function(t) {
      t.checked = !0;
    }), me.length = Le = Ie = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        g && (this._onDragOver(t), an(t));
        break;
      case "selectstart":
        t.preventDefault();
        break;
    }
  },
  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function() {
    for (var t = [], e, i = this.el.children, o = 0, a = i.length, r = this.options; o < a; o++)
      e = i[o], q(e, r.draggable, this.el, !1) && t.push(e.getAttribute(r.dataIdAttr) || un(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, o = this.el;
    this.toArray().forEach(function(a, r) {
      var s = o.children[r];
      q(s, this.options.draggable, o, !1) && (i[a] = s);
    }, this), e && this.captureAnimationState(), t.forEach(function(a) {
      i[a] && (o.removeChild(i[a]), o.appendChild(i[a]));
    }), e && this.animateAll();
  },
  /**
   * Save the current sorting
   */
  save: function() {
    var t = this.options.store;
    t && t.set && t.set(this);
  },
  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function(t, e) {
    return q(t, e || this.options.draggable, this.el, !1);
  },
  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function(t, e) {
    var i = this.options;
    if (e === void 0)
      return i[t];
    var o = Qt.modifyOption(this, t, e);
    typeof o < "u" ? i[t] = o : i[t] = e, t === "group" && Zi(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    R("destroy", this);
    var t = this.el;
    t[F] = null, x(t, "mousedown", this._onTapStart), x(t, "touchstart", this._onTapStart), x(t, "pointerdown", this._onTapStart), this.nativeDraggable && (x(t, "dragover", this), x(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), ge.splice(ge.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!ot) {
      if (R("hideClone", this), b.eventCanceled) return;
      y(T, "display", "none"), this.options.removeCloneOnHide && T.parentNode && T.parentNode.removeChild(T), ot = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (ot) {
      if (R("showClone", this), b.eventCanceled) return;
      g.parentNode == k && !this.options.group.revertClone ? k.insertBefore(T, g) : gt ? k.insertBefore(T, gt) : k.appendChild(T), this.options.group.revertClone && this.animate(g, T), y(T, "display", ""), ot = !1;
    }
  }
};
function an(n) {
  n.dataTransfer && (n.dataTransfer.dropEffect = "move"), n.cancelable && n.preventDefault();
}
function oe(n, t, e, i, o, a, r, s) {
  var c, l = n[F], u = l.options.onMove, d;
  return window.CustomEvent && !Q && !Jt ? c = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (c = document.createEvent("Event"), c.initEvent("move", !0, !0)), c.to = t, c.from = n, c.dragged = e, c.draggedRect = i, c.related = o || t, c.relatedRect = a || L(t), c.willInsertAfter = s, c.originalEvent = r, n.dispatchEvent(c), u && (d = u.call(l, c, r)), d;
}
function Me(n) {
  n.draggable = !1;
}
function rn() {
  Be = !1;
}
function sn(n, t, e) {
  var i = L(kt(e.el, 0, e.options, !0)), o = Gi(e.el, e.options, w), a = 10;
  return t ? n.clientX < o.left - a || n.clientY < i.top && n.clientX < i.right : n.clientY < o.top - a || n.clientY < i.bottom && n.clientX < i.left;
}
function cn(n, t, e) {
  var i = L(Ze(e.el, e.options.draggable)), o = Gi(e.el, e.options, w), a = 10;
  return t ? n.clientX > o.right + a || n.clientY > i.bottom && n.clientX > i.left : n.clientY > o.bottom + a || n.clientX > i.right && n.clientY > i.top;
}
function ln(n, t, e, i, o, a, r, s) {
  var c = i ? n.clientY : n.clientX, l = i ? e.height : e.width, u = i ? e.top : e.left, d = i ? e.bottom : e.right, h = !1;
  if (!r) {
    if (s && se < l * o) {
      if (!Kt && (Vt === 1 ? c > u + l * a / 2 : c < d - l * a / 2) && (Kt = !0), Kt)
        h = !0;
      else if (Vt === 1 ? c < u + se : c > d - se)
        return -Vt;
    } else if (c > u + l * (1 - o) / 2 && c < d - l * (1 - o) / 2)
      return dn(t);
  }
  return h = h || r, h && (c < u + l * a / 2 || c > d - l * a / 2) ? c > u + l / 2 ? 1 : -1 : 0;
}
function dn(n) {
  return U(g) < U(n) ? 1 : -1;
}
function un(n) {
  for (var t = n.tagName + n.className + n.src + n.href + n.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function hn(n) {
  me.length = 0;
  for (var t = n.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && me.push(i);
  }
}
function ce(n) {
  return setTimeout(n, 0);
}
function ze(n) {
  return clearTimeout(n);
}
Se && S(document, "touchmove", function(n) {
  (b.active || St) && n.cancelable && n.preventDefault();
});
b.utils = {
  on: S,
  off: x,
  css: y,
  find: Ki,
  is: function(t, e) {
    return !!q(t, e, t, !1);
  },
  extend: jo,
  throttle: ji,
  closest: q,
  toggleClass: z,
  clone: Yi,
  index: U,
  nextTick: ce,
  cancelNextTick: ze,
  detectDirection: Qi,
  getChild: kt,
  expando: F
};
b.get = function(n) {
  return n[F];
};
b.mount = function() {
  for (var n = arguments.length, t = new Array(n), e = 0; e < n; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (b.utils = j(j({}, b.utils), i.utils)), Qt.mount(i);
  });
};
b.create = function(n, t) {
  return new b(n, t);
};
b.version = Vo;
var C = [], Ft, He, Ue = !1, Pe, Ne, _e, Bt;
function pn() {
  function n() {
    this.defaults = {
      scroll: !0,
      forceAutoScrollFallback: !1,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: !0
    };
    for (var t in this)
      t.charAt(0) === "_" && typeof this[t] == "function" && (this[t] = this[t].bind(this));
  }
  return n.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? S(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? S(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? S(document, "touchmove", this._handleFallbackAutoScroll) : S(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? x(document, "dragover", this._handleAutoScroll) : (x(document, "pointermove", this._handleFallbackAutoScroll), x(document, "touchmove", this._handleFallbackAutoScroll), x(document, "mousemove", this._handleFallbackAutoScroll)), $i(), le(), Xo();
    },
    nulling: function() {
      _e = He = Ft = Ue = Bt = Pe = Ne = null, C.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var o = this, a = (e.touches ? e.touches[0] : e).clientX, r = (e.touches ? e.touches[0] : e).clientY, s = document.elementFromPoint(a, r);
      if (_e = e, i || this.options.forceAutoScrollFallback || Jt || Q || Ut) {
        Re(e, this.options, s, i);
        var c = at(s, !0);
        Ue && (!Bt || a !== Pe || r !== Ne) && (Bt && $i(), Bt = setInterval(function() {
          var l = at(document.elementFromPoint(a, r), !0);
          l !== c && (c = l, le()), Re(e, o.options, l, i);
        }, 10), Pe = a, Ne = r);
      } else {
        if (!this.options.bubbleScroll || at(s, !0) === K()) {
          le();
          return;
        }
        Re(e, this.options, at(s, !1), !1);
      }
    }
  }, J(n, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function le() {
  C.forEach(function(n) {
    clearInterval(n.pid);
  }), C = [];
}
function $i() {
  clearInterval(Bt);
}
var Re = ji(function(n, t, e, i) {
  if (t.scroll) {
    var o = (n.touches ? n.touches[0] : n).clientX, a = (n.touches ? n.touches[0] : n).clientY, r = t.scrollSensitivity, s = t.scrollSpeed, c = K(), l = !1, u;
    He !== e && (He = e, le(), Ft = t.scroll, u = t.scrollFn, Ft === !0 && (Ft = at(e, !0)));
    var d = 0, h = Ft;
    do {
      var p = h, f = L(p), _ = f.top, v = f.bottom, E = f.left, A = f.right, I = f.width, $ = f.height, ct = void 0, V = void 0, lt = p.scrollWidth, Ct = p.scrollHeight, B = y(p), Lt = p.scrollLeft, Z = p.scrollTop;
      p === c ? (ct = I < lt && (B.overflowX === "auto" || B.overflowX === "scroll" || B.overflowX === "visible"), V = $ < Ct && (B.overflowY === "auto" || B.overflowY === "scroll" || B.overflowY === "visible")) : (ct = I < lt && (B.overflowX === "auto" || B.overflowX === "scroll"), V = $ < Ct && (B.overflowY === "auto" || B.overflowY === "scroll"));
      var It = ct && (Math.abs(A - o) <= r && Lt + I < lt) - (Math.abs(E - o) <= r && !!Lt), X = V && (Math.abs(v - a) <= r && Z + $ < Ct) - (Math.abs(_ - a) <= r && !!Z);
      if (!C[d])
        for (var dt = 0; dt <= d; dt++)
          C[dt] || (C[dt] = {});
      (C[d].vx != It || C[d].vy != X || C[d].el !== p) && (C[d].el = p, C[d].vx = It, C[d].vy = X, clearInterval(C[d].pid), (It != 0 || X != 0) && (l = !0, C[d].pid = setInterval((function() {
        i && this.layer === 0 && b.active._onTouchMove(_e);
        var Ot = C[this.layer].vy ? C[this.layer].vy * s : 0, tt = C[this.layer].vx ? C[this.layer].vx * s : 0;
        typeof u == "function" && u.call(b.dragged.parentNode[F], tt, Ot, n, _e, C[this.layer].el) !== "continue" || Xi(C[this.layer].el, tt, Ot);
      }).bind({
        layer: d
      }), 24))), d++;
    } while (t.bubbleScroll && h !== c && (h = at(h, !1)));
    Ue = l;
  }
}, 30), io = function(t) {
  var e = t.originalEvent, i = t.putSortable, o = t.dragEl, a = t.activeSortable, r = t.dispatchSortableEvent, s = t.hideGhostForTarget, c = t.unhideGhostForTarget;
  if (e) {
    var l = i || a;
    s();
    var u = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, d = document.elementFromPoint(u.clientX, u.clientY);
    c(), l && !l.el.contains(d) && (r("spill"), this.onSpill({
      dragEl: o,
      putSortable: i
    }));
  }
};
function ti() {
}
ti.prototype = {
  startIndex: null,
  dragStart: function(t) {
    var e = t.oldDraggableIndex;
    this.startIndex = e;
  },
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var o = kt(this.sortable.el, this.startIndex, this.options);
    o ? this.sortable.el.insertBefore(e, o) : this.sortable.el.appendChild(e), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: io
};
J(ti, {
  pluginName: "revertOnSpill"
});
function ei() {
}
ei.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, o = i || this.sortable;
    o.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), o.animateAll();
  },
  drop: io
};
J(ei, {
  pluginName: "removeOnSpill"
});
b.mount(new pn());
b.mount(ei, ti);
const fn = {
  room: "area"
}, oo = /* @__PURE__ */ new Set(["building", "grounds"]);
function gn(n) {
  const t = String(n ?? "area").trim().toLowerCase(), e = fn[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" ? e : "area";
}
function st(n) {
  var t, e;
  return gn((e = (t = n.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function We(n) {
  return n === "floor" ? ["root", "building"] : oo.has(n) ? ["root"] : n === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds"] : ["root", "floor", "area", "building", "grounds"];
}
function mn(n, t) {
  return We(n).includes(t);
}
function _n(n) {
  var l;
  const { locations: t, locationId: e, newParentId: i } = n;
  if (i === e || i && de(t, e, i)) return !1;
  const o = new Map(t.map((u) => [u.id, u])), a = o.get(e);
  if (!a || i && !o.get(i) || i && ((l = o.get(i)) != null && l.is_explicit_root) || t.some((u) => u.parent_id === a.id) && i !== a.parent_id) return !1;
  const s = st(a);
  if (oo.has(s))
    return i === null;
  const c = i === null ? "root" : st(o.get(i) ?? {});
  return !!mn(s, c);
}
function de(n, t, e) {
  if (t === e) return !1;
  const i = new Map(n.map((r) => [r.id, r]));
  let o = i.get(e);
  const a = /* @__PURE__ */ new Set();
  for (; o != null && o.parent_id; ) {
    if (o.parent_id === t || a.has(o.parent_id)) return !0;
    a.add(o.parent_id), o = i.get(o.parent_id);
  }
  return !1;
}
function vn(n) {
  const t = n.toLowerCase(), e = {
    kitchen: ["kitchen", "kitchenette"],
    bedroom: ["bedroom", "bed", "master bedroom", "guest room", "kids room"],
    bathroom: ["bathroom", "bath", "half bath", "powder room"],
    living: ["living room", "family room", "den"],
    dining: ["dining room", "dining"],
    office: ["office", "study", "home office"],
    garage: ["garage", "carport"],
    patio: ["patio", "deck", "porch"],
    utility: ["laundry", "utility room"],
    storage: ["closet", "pantry", "attic"],
    gym: ["gym", "exercise room"],
    theater: ["media room", "theater"]
  }, i = {
    kitchen: "mdi:silverware-fork-knife",
    bedroom: "mdi:bed",
    bathroom: "mdi:shower",
    living: "mdi:sofa",
    dining: "mdi:table-furniture",
    office: "mdi:desk",
    garage: "mdi:garage",
    patio: "mdi:flower",
    utility: "mdi:washing-machine",
    storage: "mdi:package-variant",
    gym: "mdi:dumbbell",
    theater: "mdi:theater"
  };
  for (const [o, a] of Object.entries(e))
    if (a.some((r) => t.includes(r)))
      return i[o] ?? null;
  return null;
}
function no(n) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius"
  }[n] ?? "mdi:map-marker";
}
function yn(n) {
  const t = String(n ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : "area";
}
function bn(n) {
  var o;
  const t = (o = n.modules) == null ? void 0 : o._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = vn(n.name);
  if (e) return e;
  const i = yn(t == null ? void 0 : t.type);
  return no(i);
}
function Ei(n, t) {
  const e = /* @__PURE__ */ new Map();
  for (const a of n) {
    const r = a.parent_id;
    e.has(r) || e.set(r, []), e.get(r).push(a);
  }
  const i = [];
  function o(a, r) {
    const s = e.get(a) || [];
    for (const c of s) {
      const u = (e.get(c.id) || []).length > 0, d = t.has(c.id);
      i.push({ location: c, depth: r, hasChildren: u, isExpanded: d }), d && u && o(c.id, r + 1);
    }
  }
  return o(null, 0), i;
}
function wn(n, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const o of n) {
      const a = o.location.parent_id;
      a && e.has(a) && !e.has(o.location.id) && (e.add(o.location.id), i = !0);
    }
  }
  return e;
}
function xn(n, t, e, i, o, a) {
  const s = wn(n, t), c = n.filter((v) => !s.has(v.location.id));
  let l = o;
  const u = n.find((v) => v.location.id === t), d = u ? st(u.location) : "area", h = a != null && a.relatedId ? c.find((v) => v.location.id === a.relatedId) : void 0;
  if (h) {
    const v = st(h.location);
    h.location.id === o ? l = h.location.parent_id : v === "floor" ? d === "floor" || (a == null ? void 0 : a.pointerX) !== void 0 && (a == null ? void 0 : a.relatedLeft) !== void 0 && a.pointerX < a.relatedLeft + 10 ? l = h.location.parent_id : l = h.location.id : (a == null ? void 0 : a.pointerX) !== void 0 && (a == null ? void 0 : a.relatedLeft) !== void 0 && a.pointerX < a.relatedLeft + 10 ? l = h.location.parent_id : (a == null ? void 0 : a.pointerX) !== void 0 && (a == null ? void 0 : a.relatedLeft) !== void 0 && a.pointerX >= a.relatedLeft + 10 || h.isExpanded && (a != null && a.willInsertAfter) ? l = d === "floor" && v !== "building" ? h.location.parent_id : h.location.id : l = h.location.parent_id;
  }
  const p = c.filter((v) => v.location.parent_id === l);
  if (h) {
    if (l === h.location.id)
      return { parentId: l, siblingIndex: p.length };
    const v = p.findIndex(
      (E) => E.location.id === h.location.id
    );
    if (v >= 0) {
      const E = a != null && a.willInsertAfter ? v + 1 : v;
      return { parentId: l, siblingIndex: Math.max(0, Math.min(E, p.length)) };
    }
  }
  const f = Math.max(
    0,
    Math.min(
      i > e ? i - s.size : i,
      c.length
    )
  ), _ = c.slice(0, f).filter((v) => v.location.parent_id === l).length;
  return { parentId: l, siblingIndex: _ };
}
const ve = class ve extends Y {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveDropContextFromPointer(t, e, i) {
    var r;
    if (i === void 0) return;
    const o = Array.from(
      ((r = this.shadowRoot) == null ? void 0 : r.querySelectorAll(".tree-item[data-id]")) || []
    );
    let a;
    for (const s of o) {
      const c = s.getAttribute("data-id") || void 0;
      if (!c || c === t || de(this.locations, t, c)) continue;
      const l = s.getBoundingClientRect(), u = l.top + l.height / 2, d = Math.abs(i - u);
      (!a || d < a.dist) && (a = { id: c, left: l.left, centerY: u, dist: d });
    }
    if (a)
      return {
        relatedId: a.id,
        relatedLeft: a.left,
        pointerX: e,
        willInsertAfter: i >= a.centerY
      };
  }
  _resolveRelatedId(t) {
    var r, s, c;
    const e = ((r = t.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const o = (s = t.originalEvent) == null ? void 0 : s.clientY;
    if (o !== void 0) {
      const l = Array.from(
        ((c = this.shadowRoot) == null ? void 0 : c.querySelectorAll(".tree-item[data-id]")) || []
      );
      let u, d = Number.POSITIVE_INFINITY;
      for (const h of l) {
        const p = h.getAttribute("data-id") || void 0;
        if (!p || p === e || de(this.locations, e, p))
          continue;
        const f = h.getBoundingClientRect(), _ = f.top + f.height / 2, v = Math.abs(o - _);
        v < d && (d = v, u = p);
      }
      if (u) return u;
    }
    let a = i;
    for (; a; ) {
      if (a.classList.contains("tree-item")) {
        const l = a.getAttribute("data-id") || void 0;
        if (l && l !== e && !de(this.locations, e, l))
          return l;
      }
      a = t.willInsertAfter ? a.nextElementSibling : a.previousElementSibling;
    }
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("locations") && this.locations.length > 0 && this._initializeExpansion();
  }
  firstUpdated() {
    this._initializeSortable();
  }
  updated(t) {
    super.updated(t), (t.has("locations") || t.has("version")) && (this._cleanupDuplicateTreeItems(), this._isDragging || this._initializeSortable());
  }
  _initializeExpansion() {
    if (this.locations.length === 0) return;
    const t = /* @__PURE__ */ new Set();
    for (const e of this.locations)
      e.parent_id && t.add(e.parent_id);
    if (!this._hasInitializedExpansion)
      this._expandedIds = new Set(t), this._hasInitializedExpansion = !0;
    else
      for (const e of t)
        if (!this._expandedIds.has(e)) {
          const i = new Set(this._expandedIds);
          i.add(e), this._expandedIds = i;
        }
  }
  _initializeSortable() {
    var t;
    (t = this._sortable) == null || t.destroy(), this.updateComplete.then(() => {
      var i;
      const e = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".tree-list");
      e && (this._sortable = b.create(e, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; hierarchy-rules.ts enforces move constraints.
        draggable: ".tree-item",
        onStart: () => {
          this._isDragging = !0;
        },
        onMove: (o) => {
          var s, c;
          const a = o.related;
          if (a != null && a.classList.contains("tree-item")) {
            const l = this._resolveRelatedId(o), d = ((l ? (s = this.shadowRoot) == null ? void 0 : s.querySelector(
              `.tree-item[data-id="${l}"]`
            ) : null) || a).getBoundingClientRect();
            this._lastDropContext = {
              relatedId: l ?? a.getAttribute("data-id") ?? void 0,
              willInsertAfter: o.willInsertAfter,
              pointerX: (c = o.originalEvent) == null ? void 0 : c.clientX,
              relatedLeft: d.left
            };
          }
          const r = a;
          if (r && r.classList.contains("tree-item")) {
            const l = r.getAttribute("data-id");
            l && !this._expandedIds.has(l) && (this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._autoExpandTimer = window.setTimeout(() => {
              const u = new Set(this._expandedIds);
              u.add(l), this._expandedIds = u;
            }, 800));
          }
          return !0;
        },
        onEnd: (o) => {
          this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._isDragging = !1, this._handleDragEnd(o), this._lastDropContext = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(t) {
    var v, E;
    const { item: e, newIndex: i, oldIndex: o } = t;
    if (i === void 0 || o === void 0) return;
    const a = e.getAttribute("data-id");
    if (!a) return;
    const r = this.locations.find((A) => A.id === a);
    if (!r) return;
    const s = (v = t.originalEvent) == null ? void 0 : v.clientX, c = (E = t.originalEvent) == null ? void 0 : E.clientY, u = this._resolveDropContextFromPointer(a, s, c) || this._lastDropContext, d = Ei(this.locations, this._expandedIds), h = xn(
      d,
      a,
      o,
      i,
      r.parent_id,
      u
    ), p = h.parentId, f = h.siblingIndex, _ = d.slice(0, o).filter((A) => A.location.parent_id === r.parent_id).length;
    if (p === r.parent_id && f === _) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!_n({ locations: this.locations, locationId: a, newParentId: p })) {
      this.locations.some((I) => I.parent_id === a) && p !== r.parent_id && this.dispatchEvent(
        new CustomEvent("location-move-blocked", {
          detail: {
            reason: "Parent locations cannot move under a different parent. Reorder it within the current level."
          },
          bubbles: !0,
          composed: !0
        })
      ), this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: a, newParentId: p, newIndex: f },
      bubbles: !0,
      composed: !0
    }));
  }
  _restoreTreeAfterCancelledDrop() {
    this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _cleanupDuplicateTreeItems() {
    var o;
    const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".tree-list");
    if (!t) return;
    const e = Array.from(t.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const a of e) {
      const r = a.getAttribute("data-id");
      if (r) {
        if (i.has(r)) {
          a.remove();
          continue;
        }
        i.add(r);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return m`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly, "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? m`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              ` : m`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const t = Ei(this.locations, this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return m`
      <div class="tree-list">
        ${Ho(
      t,
      (o) => `${this.version}:${o.location.id}:${o.depth}`,
      (o) => this._renderItem(
        o,
        e[o.location.id] || "unknown",
        i[o.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
      </div>
    `;
  }
  _renderItem(t, e, i) {
    var I;
    const { location: o, depth: a, hasChildren: r, isExpanded: s } = t, c = this.selectedId === o.id, l = this._editingId === o.id, u = a * 24, d = st(o), h = o.is_explicit_root ? "root" : d, p = o.is_explicit_root ? "home root" : d, f = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", _ = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", v = ((I = this.occupancyStates) == null ? void 0 : I[o.id]) === !0, E = v ? "mdi:home-account" : "mdi:home", A = v ? "Mark unoccupied" : "Mark occupied";
    return m`
      <div
        class="tree-item ${c ? "selected" : ""} ${d === "floor" ? "floor-item" : ""}"
        data-id=${o.id}
        style="margin-left: ${u}px"
        @click=${($) => this._handleClick($, o)}
      >
        <div
          class="drag-handle ${this.allowMove ? "" : "disabled"}"
          title=${this.allowMove ? "Drag to reorder or move levels." : "Hierarchy move is disabled."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${s ? "expanded" : ""} ${r ? "" : "hidden"}"
          @click=${($) => this._handleExpand($, o.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(o)}></ha-icon>
        </div>
        <div
          class="occupancy-dot ${e}"
          title=${this._getOccupancyStatusLabel(e)}
        ></div>

        ${l ? m`<input class="location-name-input" .value=${this._editingValue}
                  @input=${($) => this._editingValue = $.target.value}
                  @blur=${() => this._finishEditing(o.id)}
                  @keydown=${($) => this._handleEditKeydown($, o.id)}
                  @click=${($) => $.stopPropagation()} />` : m`<div
              class="location-name"
              @dblclick=${this.allowRename ? ($) => this._startEditing($, o) : () => {
    }}
            >${o.name}</div>`}

        <span class="type-badge ${h}">${p}</span>

        ${o.is_explicit_root || this.readOnly ? "" : m`
              <button
                class="occupancy-btn ${v ? "occupied" : ""}"
                title=${A}
                @click=${($) => this._handleOccupancyToggle($, o, v)}
              >
                <ha-icon .icon=${E}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${_}
                @click=${($) => this._handleLockToggle($, o, i)}
              >
                <ha-icon .icon=${f}></ha-icon>
              </button>
            `}
      </div>
    `;
  }
  _getOccupancyStatusLabel(t) {
    return t === "occupied" ? "Occupied" : t === "vacant" ? "Vacant" : "Unknown occupancy";
  }
  _computeOccupancyStatusByLocation() {
    const t = {}, e = new Map(this.locations.map((r) => [r.id, r])), i = /* @__PURE__ */ new Map();
    for (const r of this.locations)
      r.parent_id && (i.has(r.parent_id) || i.set(r.parent_id, []), i.get(r.parent_id).push(r.id));
    const o = /* @__PURE__ */ new Map(), a = (r) => {
      var p;
      const s = o.get(r);
      if (s) return s;
      if (!e.has(r)) return "unknown";
      const c = (p = this.occupancyStates) == null ? void 0 : p[r], l = c === !0 ? "occupied" : c === !1 ? "vacant" : "unknown", u = i.get(r) || [];
      if (!u.length)
        return o.set(r, l), l;
      const d = u.map((f) => a(f));
      let h;
      return l === "occupied" || d.includes("occupied") ? h = "occupied" : l === "vacant" || d.length > 0 && d.every((f) => f === "vacant") ? h = "vacant" : h = "unknown", o.set(r, h), h;
    };
    for (const r of this.locations)
      t[r.id] = a(r.id);
    return t;
  }
  _computeLockStateByLocation() {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {}, e = {};
    for (const o of Object.values(t)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if (a.device_class !== "occupancy") continue;
      const r = a.location_id;
      if (!r) continue;
      const s = a.locked_by;
      e[String(r)] = {
        isLocked: !!a.is_locked,
        lockedBy: Array.isArray(s) ? s.map((c) => String(c)) : []
      };
    }
    return e;
  }
  _getIcon(t) {
    var i, o, a;
    if (t.ha_area_id && ((a = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[t.ha_area_id]) != null && a.icon))
      return this.hass.areas[t.ha_area_id].icon;
    const e = st(t);
    return no(e);
  }
  _handleClick(t, e) {
    const i = t.target;
    i.closest(".drag-handle") || i.closest(".expand-btn") || i.closest(".lock-btn") || i.closest(".occupancy-btn") || this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: e.id }, bubbles: !0, composed: !0 }));
  }
  _handleExpand(t, e) {
    t.stopPropagation();
    const i = new Set(this._expandedIds);
    i.has(e) ? i.delete(e) : i.add(e), this._expandedIds = i;
  }
  _startEditing(t, e) {
    this.allowRename && (t.stopPropagation(), this._editingId = e.id, this._editingValue = e.name, this.updateComplete.then(() => {
      var o;
      const i = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".location-name-input");
      i == null || i.focus(), i == null || i.select();
    }));
  }
  _handleEditKeydown(t, e) {
    t.key === "Enter" ? (t.preventDefault(), this._finishEditing(e)) : t.key === "Escape" && (this._editingId = void 0);
  }
  _finishEditing(t) {
    var i;
    if (this._editingId !== t) return;
    const e = this._editingValue.trim();
    this._editingId = void 0, !(!e || e === ((i = this.locations.find((o) => o.id === t)) == null ? void 0 : i.name)) && this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId: t, newName: e }, bubbles: !0, composed: !0 }));
  }
  _handleDelete(t, e) {
    this.readOnly || e.is_explicit_root || (t.stopPropagation(), confirm(`Delete "${e.name}"?`) && this.dispatchEvent(new CustomEvent("location-delete", { detail: { location: e }, bubbles: !0, composed: !0 })));
  }
  _handleCreate() {
    this.readOnly || this.dispatchEvent(new CustomEvent("location-create", { bubbles: !0, composed: !0 }));
  }
  _handleLockToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-lock-toggle", {
        detail: {
          locationId: e.id,
          lock: !i.isLocked
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOccupancyToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: {
          locationId: e.id,
          occupied: !i
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOpenSettings(t) {
    var i;
    t.preventDefault();
    const e = (i = this.hass) == null ? void 0 : i.navigate;
    typeof e == "function" ? e("/config/areas") : window.location.href = "/config/areas";
  }
};
ve.properties = {
  hass: { attribute: !1 },
  locations: { attribute: !1 },
  version: { type: Number },
  selectedId: {},
  occupancyStates: { attribute: !1 },
  readOnly: { type: Boolean },
  allowMove: { type: Boolean },
  allowRename: { type: Boolean },
  // Internal state
  _expandedIds: { state: !0 },
  _editingId: { state: !0 },
  _editingValue: { state: !0 },
  _isDragging: { state: !0 }
}, ve.styles = [
  Gt,
  Tt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
        color: var(--primary-text-color);
        gap: var(--spacing-xs);
        min-height: 36px;
      }

      .tree-item:hover {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
      }

      .tree-item.selected {
        background: rgba(var(--rgb-primary-color), 0.12);
        color: var(--primary-color);
        font-weight: 600;
      }

      .tree-item.selected:hover {
        background: rgba(var(--rgb-primary-color), 0.2);
      }

      .drag-handle {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        opacity: 0.35;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        margin-right: var(--spacing-xs);
      }

      .tree-item:hover .drag-handle {
        opacity: 0.9;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .drag-handle.disabled {
        pointer-events: none;
      }

      .expand-btn {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        border: none;
        background: transparent;
        color: inherit;
        padding: 0;
        transition: transform 0.2s;
      }

      .expand-btn.expanded {
        transform: rotate(90deg);
      }

      .expand-btn.hidden {
        visibility: hidden;
      }

      .location-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .tree-item.selected .location-icon {
        color: var(--primary-color);
      }

      .occupancy-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }

      .occupancy-dot.occupied {
        background: #22c55e;
        border-color: #16a34a;
      }

      .occupancy-dot.vacant {
        background: #d1d5db;
        border-color: #9ca3af;
      }

      .occupancy-dot.unknown {
        background: #f59e0b;
        border-color: #d97706;
      }

      .location-name {
        flex: 1;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .location-name-input {
        flex: 1;
        background: var(--card-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 14px;
        color: var(--primary-text-color);
        outline: none;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: var(--spacing-sm);
        flex-shrink: 0;
      }

      .type-badge.floor {
        background: rgba(var(--rgb-primary-color), 0.15);
        color: var(--primary-color);
      }

      .type-badge.area {
        background: rgba(var(--rgb-warning-color), 0.15);
        color: var(--warning-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .type-badge.root {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .tree-item.selected .type-badge.root {
        background: var(--info-color);
        color: white;
      }

      .delete-btn {
        opacity: 0.6;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .delete-btn {
        opacity: 1;
      }

      .tree-item.selected .delete-btn {
        opacity: 1;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .lock-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .lock-btn,
      .tree-item.selected .lock-btn {
        opacity: 1;
      }

      .lock-btn.locked {
        color: var(--warning-color);
      }

      .lock-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .occupancy-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .occupancy-btn,
      .tree-item.selected .occupancy-btn {
        opacity: 1;
      }

      .occupancy-btn.occupied {
        color: var(--success-color);
      }

      .occupancy-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .sortable-ghost {
        opacity: 0.5;
        background: rgba(var(--rgb-primary-color), 0.12);
      }

      .sortable-chosen {
        background: rgba(var(--rgb-primary-color), 0.08);
      }
    `
];
let qe = ve;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", qe);
const nt = 30 * 60, Ai = 5 * 60;
function ao(n) {
  if (!n) return "";
  const t = n.indexOf(".");
  return t >= 0 ? n.slice(0, t) : "";
}
function Sn(n) {
  return ["door", "garage_door", "opening", "window"].includes(n || "");
}
function $n(n) {
  return ["presence", "occupancy"].includes(n || "");
}
function En(n) {
  return n === "motion";
}
function ro(n) {
  return n === "media_player";
}
function so(n) {
  var i;
  const t = ao(n == null ? void 0 : n.entity_id), e = (i = n == null ? void 0 : n.attributes) == null ? void 0 : i.device_class;
  if (ro(t))
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: nt,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: nt,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: Ai
    };
  if (t === "binary_sensor") {
    if ($n(e))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: Ai
      };
    if (En(e))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: nt,
        off_event: "none",
        off_trailing: 0
      };
    if (Sn(e))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: nt,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (n == null ? void 0 : n.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: nt,
    off_event: "none",
    off_trailing: 0
  };
}
function An(n, t, e) {
  const i = ao(e == null ? void 0 : e.entity_id), o = so(e);
  if (ro(i)) {
    const r = n.on_timeout && n.on_timeout > 0 ? n.on_timeout : nt;
    return {
      ...n,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const r = n.on_timeout ?? (o.mode === "any_change" ? o.on_timeout : nt);
    return {
      ...n,
      mode: t,
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  const a = o.mode === "specific_states" ? o : {
    ...o,
    on_event: "trigger",
    on_timeout: nt,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...n,
    mode: t,
    on_event: n.on_event ?? a.on_event,
    on_timeout: n.on_timeout ?? a.on_timeout,
    off_event: n.off_event ?? a.off_event,
    off_trailing: n.off_trailing ?? a.off_trailing
  };
}
const co = "topomation_", ue = "[topomation]", kn = "Topomation", Tn = "Topomation - On Occupied", Dn = "Topomation - On Vacant", ki = "Topomation";
function Cn(n) {
  return n.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "location";
}
function Ti(n) {
  return `config/automation/config/${encodeURIComponent(n)}`;
}
async function lo(n, t, e, i) {
  if (typeof n.callApi == "function")
    return n.callApi(t, Ti(e), i);
  const o = await fetch(`/api/${Ti(e)}`, {
    method: t.toUpperCase(),
    credentials: "same-origin",
    headers: i !== void 0 ? {
      "Content-Type": "application/json"
    } : void 0,
    body: i !== void 0 ? JSON.stringify(i) : void 0
  }), a = await o.json().catch(() => ({}));
  if (!o.ok)
    throw new Error(
      a && typeof a.message == "string" && a.message || `Home Assistant automation API error (${o.status})`
    );
  return a;
}
function Ln(n) {
  if (typeof n != "string" || !n.includes(ue))
    return null;
  const t = n.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
  for (const e of t) {
    if (!e.startsWith(ue)) continue;
    const i = e.slice(ue.length).trim();
    if (!i) return null;
    try {
      const o = JSON.parse(i);
      if (typeof (o == null ? void 0 : o.location_id) == "string" && ((o == null ? void 0 : o.trigger_type) === "occupied" || (o == null ? void 0 : o.trigger_type) === "vacant"))
        return {
          version: Number(o.version) || 1,
          location_id: o.location_id,
          trigger_type: o.trigger_type
        };
    } catch {
      return null;
    }
  }
  return null;
}
function In(n) {
  return `${ue} ${JSON.stringify(n)}`;
}
function On(n) {
  var s, c;
  const t = (n == null ? void 0 : n.actions) ?? (n == null ? void 0 : n.action), e = Array.isArray(t) ? t[0] : t;
  if (!e || typeof e != "object")
    return {};
  const i = typeof e.action == "string" ? e.action : "", o = i.includes(".") ? i.split(".").slice(1).join(".") : i, a = (s = e == null ? void 0 : e.target) == null ? void 0 : s.entity_id;
  if (typeof a == "string")
    return {
      action_entity_id: a,
      action_service: o || void 0
    };
  if (Array.isArray(a) && typeof a[0] == "string")
    return {
      action_entity_id: a[0],
      action_service: o || void 0
    };
  const r = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
  return typeof r == "string" ? {
    action_entity_id: r,
    action_service: o || void 0
  } : {
    action_service: o || void 0
  };
}
function Mn(n, t) {
  const e = n.states || {};
  for (const [i, o] of Object.entries(e)) {
    if (!i.startsWith("binary_sensor.")) continue;
    const a = (o == null ? void 0 : o.attributes) || {};
    if (a.device_class === "occupancy" && a.location_id === t)
      return i;
  }
}
async function uo(n) {
  const t = await n.callWS({ type: "config/entity_registry/list" });
  return Array.isArray(t) ? t.filter((e) => !e || typeof e.entity_id != "string" ? !1 : (typeof e.domain == "string" ? e.domain : String(e.entity_id).split(".", 1)[0]) === "automation") : [];
}
async function Pn(n, t, e = 8, i = 200) {
  for (let o = 0; o < e; o += 1) {
    const r = (await uo(n)).find((s) => s.unique_id === t);
    if (r)
      return r;
    await new Promise((s) => window.setTimeout(s, i));
  }
}
async function Di(n, t) {
  const e = await n.callWS({ type: "config/label_registry/list" }), i = Array.isArray(e) ? e.find((o) => (o == null ? void 0 : o.name) === t && typeof (o == null ? void 0 : o.label_id) == "string") : void 0;
  if (i)
    return i.label_id;
  try {
    const o = await n.callWS({
      type: "config/label_registry/create",
      name: t
    });
    if (typeof (o == null ? void 0 : o.label_id) == "string")
      return o.label_id;
  } catch (o) {
    console.debug("[ha-automation-rules] failed to create label", t, o);
  }
}
async function Nn(n) {
  const t = await n.callWS({
    type: "config/category_registry/list",
    scope: "automation"
  }), e = Array.isArray(t) ? t.find(
    (i) => (i == null ? void 0 : i.name) === ki && typeof (i == null ? void 0 : i.category_id) == "string"
  ) : void 0;
  if (e)
    return e.category_id;
  try {
    const i = await n.callWS({
      type: "config/category_registry/create",
      scope: "automation",
      name: ki,
      icon: "mdi:home-automation"
    });
    if (typeof (i == null ? void 0 : i.category_id) == "string")
      return i.category_id;
  } catch (i) {
    console.debug("[ha-automation-rules] failed to create automation category", i);
  }
}
async function Rn(n, t, e) {
  if (!t.entity_id) return;
  const i = await Di(n, kn), a = await Di(n, e === "occupied" ? Tn : Dn), r = await Nn(n), s = new Set(Array.isArray(t.labels) ? t.labels : []);
  i && s.add(i), a && s.add(a);
  const c = {
    ...t.categories || {}
  };
  r && (c.automation = r);
  try {
    await n.callWS({
      type: "config/entity_registry/update",
      entity_id: t.entity_id,
      labels: Array.from(s),
      categories: c
    });
  } catch (l) {
    console.debug("[ha-automation-rules] failed to assign labels/category", l);
  }
}
function Fn(n, t) {
  const e = Date.now(), i = Math.floor(Math.random() * 1e6).toString(36).padStart(4, "0");
  return `${co}${Cn(n.id)}_${t}_${e}_${i}`;
}
async function Bn(n, t) {
  const i = (await uo(n)).filter((a) => (typeof a.unique_id == "string" ? a.unique_id : "").startsWith(co));
  return (await Promise.all(
    i.map(async (a) => {
      var s, c;
      const r = String(a.unique_id || "").trim();
      if (!(!a.entity_id || !r))
        try {
          const l = await n.callWS({
            type: "automation/config",
            entity_id: a.entity_id
          }), u = l == null ? void 0 : l.config;
          if (!u || typeof u != "object")
            return;
          const d = Ln(u.description);
          if (!d || d.location_id !== t)
            return;
          const h = On(u), p = (s = n.states) == null ? void 0 : s[a.entity_id], f = p ? p.state !== "off" : !0, _ = typeof u.alias == "string" && u.alias.trim() || ((c = p == null ? void 0 : p.attributes) == null ? void 0 : c.friendly_name) || a.entity_id;
          return {
            id: r,
            entity_id: a.entity_id,
            name: _,
            trigger_type: d.trigger_type,
            action_entity_id: h.action_entity_id,
            action_service: h.action_service,
            enabled: f
          };
        } catch (l) {
          console.debug("[ha-automation-rules] failed to read automation config", a.entity_id, l);
          return;
        }
    })
  )).filter((a) => !!a).sort((a, r) => a.name.localeCompare(r.name));
}
async function zn(n, t) {
  const e = Mn(n, t.location.id);
  if (!e)
    throw new Error(
      `No occupancy binary sensor found for location "${t.location.name}" (${t.location.id})`
    );
  const i = Fn(t.location, t.trigger_type), o = t.trigger_type === "occupied" ? "on" : "off", a = t.action_entity_id.includes(".") ? t.action_entity_id.split(".", 1)[0] : "homeassistant", r = {
    version: 1,
    location_id: t.location.id,
    trigger_type: t.trigger_type
  };
  await lo(n, "post", i, {
    alias: t.name,
    description: `Managed by Topomation.
${In(r)}`,
    triggers: [
      {
        trigger: "state",
        entity_id: e,
        to: o
      }
    ],
    conditions: [],
    actions: [
      {
        action: `${a}.${t.action_service}`,
        target: {
          entity_id: t.action_entity_id
        }
      }
    ],
    mode: "single"
  });
  const s = await Pn(n, i);
  return s && await Rn(n, s, t.trigger_type), {
    id: i,
    entity_id: (s == null ? void 0 : s.entity_id) || `automation.${i}`,
    name: t.name,
    trigger_type: t.trigger_type,
    action_entity_id: t.action_entity_id,
    action_service: t.action_service,
    enabled: !0
  };
}
async function Hn(n, t) {
  await lo(n, "delete", t);
}
async function Un(n, t, e) {
  await n.callWS({
    type: "call_service",
    domain: "automation",
    service: e ? "turn_on" : "turn_off",
    service_data: {
      entity_id: t.entity_id
    }
  });
}
function Wn(n) {
  return `/config/automation/edit/${encodeURIComponent(n.id)}`;
}
console.log("[ht-location-inspector] module loaded");
var Li, Ii;
try {
  (Ii = (Li = import.meta) == null ? void 0 : Li.hot) == null || Ii.accept(() => window.location.reload());
} catch {
}
const ye = class ye extends Y {
  constructor() {
    super(...arguments), this._activeTab = "detection", this._sourcesDirty = !1, this._savingSource = !1, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._actionRules = [], this._loadingActionRules = !1, this._nowEpochMs = Date.now(), this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._discardSourceChanges = () => {
      this._stagedSources = void 0, this._sourcesDirty = !1, this.requestUpdate();
    }, this._saveSourceChanges = async () => {
      !this.location || !this._stagedSources || !this._sourcesDirty || (await this._persistOccupancySources(this._stagedSources), this._stagedSources = void 0, this._sourcesDirty = !1, this.requestUpdate(), this._showToast("Saved source changes", "success"));
    };
  }
  render() {
    return this.location ? m`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()} ${this._renderContent()}
      </div>
    ` : m`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  willUpdate(t) {
    var e;
    if (t.has("hass") && (this._entityAreaById = {}, this._entityAreaLoadPromise = void 0, this.hass && (this._loadEntityAreaAssignments(), this._loadActionRules())), t.has("forcedTab")) {
      const i = this._mapRequestedTab(this.forcedTab);
      i ? this._activeTab = i : t.get("forcedTab") && (this._activeTab = "detection");
    }
    if (t.has("location")) {
      const i = t.get("location"), o = (i == null ? void 0 : i.id) || "", a = ((e = this.location) == null ? void 0 : e.id) || "";
      o !== a && (this._stagedSources = void 0, this._sourcesDirty = !1, this._externalAreaId = "", this._externalEntityId = "", this._onTimeoutMemory = {}, this.hass && this._loadEntityAreaAssignments()), this._loadActionRules();
    }
  }
  async _loadActionRules() {
    var i;
    const t = ++this._actionRulesLoadSeq, e = (i = this.location) == null ? void 0 : i.id;
    if (!e || !this.hass) {
      this._actionRules = [], this._loadingActionRules = !1, this._actionRulesError = void 0;
      return;
    }
    this._loadingActionRules = !0, this._actionRulesError = void 0, this.requestUpdate();
    try {
      const o = await Bn(this.hass, e);
      if (t !== this._actionRulesLoadSeq) return;
      this._actionRules = o;
    } catch (o) {
      if (t !== this._actionRulesLoadSeq) return;
      this._actionRules = [], this._actionRulesError = (o == null ? void 0 : o.message) || "Failed to load automation rules";
    } finally {
      t === this._actionRulesLoadSeq && (this._loadingActionRules = !1, this.requestUpdate());
    }
  }
  async _loadEntityAreaAssignments() {
    var t;
    this._entityAreaLoadPromise || !((t = this.hass) != null && t.callWS) || (this._entityAreaLoadPromise = (async () => {
      try {
        const [e, i] = await Promise.all([
          this.hass.callWS({ type: "config/entity_registry/list" }),
          this.hass.callWS({ type: "config/device_registry/list" })
        ]), o = /* @__PURE__ */ new Map();
        if (Array.isArray(i))
          for (const r of i) {
            const s = typeof (r == null ? void 0 : r.id) == "string" ? r.id : void 0, c = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0;
            s && c && o.set(s, c);
          }
        const a = {};
        if (Array.isArray(e))
          for (const r of e) {
            const s = typeof (r == null ? void 0 : r.entity_id) == "string" ? r.entity_id : void 0;
            if (!s) continue;
            const c = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0, l = typeof (r == null ? void 0 : r.device_id) == "string" ? o.get(r.device_id) : void 0;
            a[s] = c || l || null;
          }
        this._entityAreaById = a;
      } catch (e) {
        console.debug("[ht-location-inspector] failed to load entity/device registry area mapping", e), this._entityAreaById = {};
      } finally {
        this._entityAreaLoadPromise = void 0, this.requestUpdate();
      }
    })(), await this._entityAreaLoadPromise);
  }
  _renderHeader() {
    if (!this.location) return "";
    const t = this.location.ha_area_id, e = t ? "HA Area ID:" : "Location ID:", i = t || this.location.id;
    return m`
      <div class="header">
        <div class="header-icon">
          <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
        </div>
        <div class="header-content">
          <div class="location-name">${this.location.name}</div>
          <div class="location-id">
            <span class="id-label">${e}</span>${i}
          </div>
        </div>
      </div>
    `;
  }
  _headerIcon(t) {
    var i, o, a;
    const e = t.ha_area_id;
    return e && ((a = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[e]) != null && a.icon) ? this.hass.areas[e].icon : bn(t);
  }
  _renderTabs() {
    return m`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "detection", this.requestUpdate();
    }}
        >
          Detection
        </button>
        <button
          class="tab ${this._activeTab === "occupied_actions" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "occupied_actions", this.requestUpdate();
    }}
        >
          On Occupied
        </button>
        <button
          class="tab ${this._activeTab === "vacant_actions" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "vacant_actions", this.requestUpdate();
    }}
        >
          On Vacant
        </button>
      </div>
    `;
  }
  _renderContent() {
    const t = this._effectiveTab();
    return m`
      <div class="tab-content">
        ${t === "detection" ? this._renderOccupancyTab() : this._renderActionsTab(t === "occupied_actions" ? "occupied" : "vacant")}
      </div>
    `;
  }
  _effectiveTab() {
    return this._activeTab;
  }
  _mapRequestedTab(t) {
    if (t === "detection") return "detection";
    if (t === "occupied_actions") return "occupied_actions";
    if (t === "vacant_actions") return "vacant_actions";
    if (t === "occupancy") return "detection";
    if (t === "actions") return "occupied_actions";
  }
  connectedCallback() {
    super.connectedCallback(), this._startClockTicker();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._stopClockTicker();
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const t = this.location.modules.occupancy || {}, e = this._isFloorLocation(), i = !!this.location.ha_area_id, o = (t.occupancy_sources || []).length, a = this._getLockState();
    return e ? m`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:layers"}></ha-icon>
            Floor Occupancy Policy
          </div>
          <div class="policy-note">
            Occupancy sources are disabled for floor locations. Assign sensors to area locations, then
            use floor-level automation by aggregating those child areas.
          </div>
          ${o > 0 ? m`
                <div class="policy-warning">
                  This floor still has ${o} legacy source${o === 1 ? "" : "s"} in
                  config. Floor sources are unsupported and should be moved to areas.
                </div>
              ` : ""}
        </div>
      ` : m`
      <div>
        <div class="card-section">
          ${this._renderRuntimeStatus(a)}
          ${a.isLocked ? m`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${a.lockedBy.length ? m`Held by ${a.lockedBy.join(", ")}.` : m`Occupancy is currently held by a lock.`}
              </div>
              ${a.lockModes.length ? m`
                    <div class="runtime-note">
                      Modes: ${a.lockModes.map((r) => this._lockModeLabel(r)).join(", ")}
                    </div>
                  ` : ""}
              ${a.directLocks.length ? m`
                    <div class="lock-directive-list">
                      ${a.directLocks.map((r) => m`
                        <div class="lock-directive">
                          <span class="lock-pill">${r.sourceId}</span>
                          <span>${this._lockModeLabel(r.mode)}</span>
                          <span>${this._lockScopeLabel(r.scope)}</span>
                        </div>
                      `)}
                    </div>
                  ` : m`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="section-title">
            Sources
          </div>
          <div class="subsection-help">
            ${i ? "Use the left control to include a source from this area. Included sources show editable behavior below." : "This location is integration-owned (no direct HA area mapping). Add sources explicitly from Home Assistant entities below."}
          </div>
          ${i ? "" : m`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(t)}
          <div class="subsection-help">
            ${i ? "Need cross-area behavior? Add a source from another area." : "Add sources from any HA area (or unassigned entities)."}
          </div>
          ${this._renderExternalSourceComposer(t)}
          ${this._sourcesDirty ? m`
            <div class="editor-actions sources-actions">
              <button
                class="button button-secondary"
                ?disabled=${this._savingSource}
                @click=${this._discardSourceChanges}
              >
                Discard
              </button>
              <button
                class="button button-primary"
                ?disabled=${this._savingSource}
                @click=${this._saveSourceChanges}
              >
                Save
              </button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
  _renderRuntimeStatus(t) {
    const e = this._getOccupancyState();
    if (!e)
      return m`
        <div class="runtime-grid">
          <div class="runtime-row">
            <div class="runtime-key">Occupancy</div>
            <div class="runtime-value">Sensor unavailable</div>
          </div>
        </div>
      `;
    const i = e.attributes || {}, o = e.state === "on", a = this._resolveVacantAt(i, o);
    let r = "Unknown", s = "Unknown";
    if (!o)
      r = "Already vacant", s = "-";
    else if (a === null) {
      const d = t.lockModes.includes("block_vacant"), h = t.lockModes.includes("freeze");
      r = d ? "Indefinite (block vacant)" : h ? "Paused while freeze lock is active" : "Indefinite", s = "Not scheduled";
    } else a instanceof Date ? (r = this._formatRelativeDuration(a), s = this._formatDateTime(a)) : t.lockModes.includes("freeze") && (r = "Paused while freeze lock is active", s = "Not scheduled");
    const c = o ? "Occupied" : e.state === "off" ? "Vacant" : "Unknown", l = t.lockModes.length ? t.lockModes.map((d) => this._lockModeLabel(d)).join(", ") : "None", u = t.lockedBy.length ? t.lockedBy.join(", ") : "None";
    return m`
      <div class="runtime-grid">
        <div class="runtime-row">
          <div class="runtime-key">Occupancy</div>
          <div class="runtime-value">${c}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Time Until Vacant</div>
          <div class="runtime-value" data-testid="runtime-time-until-vacant">${r}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Vacant At</div>
          <div class="runtime-value" data-testid="runtime-vacant-at">${s}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Lock Modes</div>
          <div class="runtime-value">${l}</div>
        </div>
        <div class="runtime-row">
          <div class="runtime-key">Lock Sources</div>
          <div class="runtime-value">${u}</div>
        </div>
      </div>
    `;
  }
  _isMediaEntity(t) {
    return t.startsWith("media_player.");
  }
  _mediaSignalLabel(t) {
    return t === "color" ? "Color change" : t === "power" ? "Power" : t === "level" ? "Level change" : t === "volume" ? "Volume" : t === "mute" ? "Mute" : "Playback";
  }
  _signalDescription(t) {
    return t === "color" ? "RGB/color changes" : t === "power" ? "on/off" : t === "level" ? "brightness changes" : t === "volume" ? "volume changes" : t === "mute" ? "mute/unmute" : "playback start/stop";
  }
  _sourceKey(t, e) {
    return e ? `${t}::${e}` : t;
  }
  _sourceKeyFromSource(t) {
    return t.signal_key ? this._sourceKey(t.entity_id, t.signal_key) : this._sourceKey(t.entity_id);
  }
  _defaultSignalKeyForEntity(t) {
    if (this._isMediaEntity(t)) return "playback";
    if (this._isDimmableEntity(t) || this._isColorCapableEntity(t)) return "power";
  }
  _candidateItemsForEntity(t) {
    if (!this._isMediaEntity(t)) {
      const e = this._isDimmableEntity(t), i = this._isColorCapableEntity(t);
      if (!e && !i)
        return [{ key: this._sourceKey(t), entityId: t }];
      const o = ["power"];
      return e && o.push("level"), i && o.push("color"), o.map((a) => ({
        key: this._sourceKey(t, a),
        entityId: t,
        signalKey: a
      }));
    }
    return ["playback", "volume", "mute"].map((e) => ({
      key: this._sourceKey(t, e),
      entityId: t,
      signalKey: e
    }));
  }
  _candidateTitle(t, e) {
    const i = this._entityName(t);
    return e && (t.startsWith("media_player.") || t.startsWith("light.")) ? `${i} — ${this._mediaSignalLabel(e)}` : !this._isMediaEntity(t) && !this._isDimmableEntity(t) && !this._isColorCapableEntity(t) ? i : `${i} — ${this._mediaSignalLabel(e)}`;
  }
  _mediaSignalDefaults(t, e) {
    return e === "playback" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "playback"),
      signal_key: "playback",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, e),
      signal_key: e,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _lightSignalDefaults(t, e) {
    return e === "power" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "power"),
      signal_key: "power",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : e === "color" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "color"),
      signal_key: "color",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, "level"),
      signal_key: "level",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _isDimmableEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (typeof o.brightness == "number") return !0;
    const a = o.supported_color_modes;
    return Array.isArray(a) ? a.some((c) => c && c !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (o.rgb_color || o.hs_color || o.xy_color) return !0;
    const a = o.supported_color_modes;
    return Array.isArray(a) ? a.some((c) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(c)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = this._workingSources(t), i = /* @__PURE__ */ new Map();
    e.forEach((u, d) => i.set(this._sourceKeyFromSource(u), d));
    const o = [...this.location.entity_ids || []].sort(
      (u, d) => this._entityName(u).localeCompare(this._entityName(d))
    );
    new Set(o);
    const r = o.filter((u) => this._isCandidateEntity(u)).flatMap((u) => this._candidateItemsForEntity(u)), s = new Set(r.map((u) => u.key)), c = e.filter((u) => !s.has(this._sourceKeyFromSource(u))).map((u) => ({
      key: this._sourceKeyFromSource(u),
      entityId: u.entity_id,
      signalKey: u.signal_key
    })), l = [...r, ...c];
    return l.length ? m`
      <div class="candidate-list">
        ${l.map((u) => {
      const d = i.get(u.key), h = d !== void 0, p = h ? e[d] : void 0, f = h && p ? p : void 0, _ = this._modeOptionsForEntity(u.entityId);
      return m`
            <div class="source-card ${h ? "enabled" : ""}">
              <div class="candidate-item">
                <div class="source-enable-control">
                  <input
                    type="checkbox"
                    class="source-enable-input"
                    aria-label="Include source"
                    .checked=${h}
                    @change=${(v) => {
        const E = v.target.checked;
        E && !h ? this._addSourceWithDefaults(u.entityId, t, {
          resetExternalPicker: !1,
          signalKey: u.signalKey
        }) : !E && h && this._removeSource(d, t);
      }}
                  />
                </div>
                <div>
                  <div class="candidate-headline">
                    <div class="candidate-title">${this._candidateTitle(u.entityId, u.signalKey)}</div>
                    ${h && f && _.length > 1 ? m`
                          <div class="inline-mode-group">
                            <span class="inline-mode-label">Mode</span>
                            <select
                              class="inline-mode-select"
                              .value=${_.some((v) => v.value === f.mode) ? f.mode : _[0].value}
                              @change=${(v) => {
        const E = v.target.value, A = this.hass.states[u.entityId], I = An(f, E, A);
        this._updateSourceDraft(t, d, { ...I, entity_id: f.entity_id });
      }}
                            >
                              ${_.map((v) => m`<option value=${v.value}>${v.label}</option>`)}
                            </select>
                          </div>
                        ` : ""}
                  </div>
                  <div class="candidate-meta">${u.entityId} • ${this._entityState(u.entityId)}</div>
                  ${(this._isMediaEntity(u.entityId) || u.entityId.startsWith("light.")) && u.signalKey ? m`<div class="candidate-submeta">Signal: ${this._mediaSignalLabel(u.signalKey)}</div>` : ""}
                </div>
              </div>
              ${h && p ? this._renderSourceEditor(t, p, d) : ""}
            </div>
          `;
    })}
      </div>
    ` : m`
        <div class="empty-state">
          <div class="text-muted">
            No occupancy-relevant entities found yet.
            Add one from another area to get started.
          </div>
        </div>
      `;
  }
  _renderExternalSourceComposer(t) {
    var u;
    const e = this._availableSourceAreas(), i = this._externalAreaId || "", o = i ? this._entitiesForArea(i) : [], a = this._externalEntityId || "", r = new Set(this._workingSources(t).map((d) => this._sourceKeyFromSource(d))), s = a ? this._defaultSignalKeyForEntity(a) : void 0, c = a ? this._sourceKey(a, s) : "", l = (u = this.location) != null && u.ha_area_id ? "Other Area" : "Source Area";
    return m`
      <div class="external-composer">
        <div class="editor-field">
          <label for="external-source-area">${l}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${i}
            @change=${(d) => {
      const h = d.target.value;
      this._externalAreaId = h, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">Select area...</option>
            <option value="__all__">Any area / unassigned</option>
            ${e.map((d) => m`<option value=${d.area_id}>${d.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${a}
            @change=${(d) => {
      this._externalEntityId = d.target.value, this.requestUpdate();
    }}
            ?disabled=${!i}
          >
            <option value="">Select sensor...</option>
            ${o.map((d) => m`
              <option
                value=${d}
                ?disabled=${r.has(this._sourceKey(d, this._defaultSignalKeyForEntity(d)))}
              >
                ${this._entityName(d)}${r.has(this._sourceKey(d, this._defaultSignalKeyForEntity(d))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !a || (c ? r.has(c) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(a, t, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(a)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderSourceEditor(t, e, i) {
    const o = e, a = this._eventLabelsForSource(e), r = this._sourceKeyFromSource(e), s = this._supportsOffBehavior(e), c = t.default_timeout || 300, l = this._onTimeoutMemory[r], u = o.on_timeout === null ? l ?? c : o.on_timeout ?? l ?? c, d = Math.max(1, Math.min(120, Math.round(u / 60))), h = o.off_trailing ?? 0, p = Math.max(0, Math.min(120, Math.round(h / 60)));
    return m`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? m`<div class="media-signals">Signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${i}">${a.onBehavior}</label>
              <button
                class="mini-button"
                type="button"
                data-testid="source-test-on"
                ?disabled=${(o.on_event || "trigger") !== "trigger"}
                @click=${() => this._handleTestSource(o, "trigger")}
              >
                Test On
              </button>
            </div>
            <select
              id="source-on-event-${i}"
              .value=${o.on_event || "trigger"}
              @change=${(f) => {
      this._updateSourceDraft(t, i, {
        ...o,
        on_event: f.target.value
      });
    }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${i}">${a.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${i}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @input=${(f) => {
      const _ = Number(f.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: _ * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: _ * 60 });
    }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @change=${(f) => {
      const _ = Math.max(1, Math.min(120, Number(f.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: _ * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: _ * 60 });
    }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${o.on_timeout === null}
                @change=${(f) => {
      const _ = f.target.checked, v = this._onTimeoutMemory[r], E = d * 60, A = v ?? E;
      _ && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: o.on_timeout ?? A
      }), this._updateSourceDraft(t, i, {
        ...o,
        on_timeout: _ ? null : A
      });
    }}
              />
              Indefinite (until ${a.offState})
            </label>
          </div>

          ${s ? m`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${i}">${a.offBehavior}</label>
                    <button
                      class="mini-button"
                      type="button"
                      data-testid="source-test-off"
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @click=${() => this._handleTestSource(o, "clear")}
                    >
                      Test Off
                    </button>
                  </div>
                  <select
                    id="source-off-event-${i}"
                    .value=${o.off_event || "none"}
                    @change=${(f) => {
      this._updateSourceDraft(t, i, {
        ...o,
        off_event: f.target.value
      });
    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${i}">${a.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${i}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(p)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @input=${(f) => {
      const _ = Math.max(0, Math.min(120, Number(f.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: _ * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(p)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @change=${(f) => {
      const _ = Math.max(0, Math.min(120, Number(f.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: _ * 60 });
    }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                </div>
              ` : ""}
        </div>
      </div>
    `;
  }
  _renderActionsTab(t) {
    if (!this.location) return "";
    const e = this._actionRules.filter((r) => r.trigger_type === t), i = t === "occupied" ? "Occupied Actions" : "Vacant Actions", o = t === "occupied" ? "No Topomation occupied automations configured." : "No Topomation vacant automations configured.", a = t === "occupied" ? "Rules in this tab run when occupancy changes to occupied." : "Rules in this tab run when occupancy changes to vacant.";
    return m`
      <div>
        ${t === "occupied" ? this._renderActionStartupConfig() : ""}
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:flash"}></ha-icon>
            ${i}
          </div>

          <div class="rules-list">
            ${this._loadingActionRules ? m`
                  <div class="empty-state">
                    <div class="text-muted">Loading Home Assistant automations...</div>
                  </div>
                ` : this._actionRulesError ? m`
                    <div class="empty-state">
                      <div class="text-muted">${this._actionRulesError}</div>
                    </div>
                  ` : e.length === 0 ? m`
                  <div class="empty-state">
                    <div class="text-muted">${o}</div>
                  </div>
                ` : e.map(
      (r) => m`
                    <div class="source-item">
                      <div class="source-icon">
                        <ha-icon .icon=${"mdi:robot"}></ha-icon>
                      </div>
                      <div class="source-info">
                        <div class="source-name">${r.name}</div>
                        <div class="source-details">
                          ${this._describeActionRule(r)}
                        </div>
                        <div class="source-details">
                          ${r.enabled ? "Enabled" : "Disabled"} • ${r.entity_id}
                        </div>
                      </div>
                      <button
                        class="icon-button"
                        title=${r.enabled ? "Disable automation" : "Enable automation"}
                        @click=${() => this._handleToggleRule(r)}
                      >
                        <ha-icon .icon=${r.enabled ? "mdi:toggle-switch" : "mdi:toggle-switch-off-outline"}></ha-icon>
                      </button>
                      <button
                        class="icon-button"
                        title="Open in Home Assistant"
                        @click=${() => window.open(Wn(r), "_blank", "noopener")}
                      >
                        <ha-icon .icon=${"mdi:open-in-new"}></ha-icon>
                      </button>
                      <button class="icon-button" @click=${() => this._handleDeleteRule(r)}>
                        <ha-icon .icon=${"mdi:delete-outline"}></ha-icon>
                      </button>
                    </div>
                  `
    )}
          </div>

          <button
            class="button button-primary"
            style="margin-top: 16px;"
            @click=${() => this._handleAddRule(t)}
          >
            + Add Rule
          </button>
        </div>

        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:information-outline"}></ha-icon>
            How it works
          </div>
          <div class="text-muted" style="font-size: 13px; line-height: 1.4;">
            ${a} Rules are created as native Home Assistant automations and tagged for this location.
          </div>
        </div>
      </div>
    `;
  }
  _renderActionStartupConfig() {
    const t = this._getAutomationConfig(), e = !!t.reapply_last_state_on_startup;
    return m`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:power-cycle"}></ha-icon>
          Startup behavior
        </div>

        <div class="config-row startup-config-row">
          <div class="startup-config-header">
            <div class="config-label">Reapply current occupancy actions on startup</div>
            <div class="config-value">
              <input
                type="checkbox"
                class="switch-input"
                .checked=${e}
                @change=${(i) => {
      const o = i.target.checked;
      this._updateAutomationConfig({
        ...t,
        reapply_last_state_on_startup: o
      });
    }}
              />
            </div>
          </div>
          <div class="config-help">
            After Home Assistant is fully started, Topomation waits briefly then reruns
            this location's occupied or vacant automations based on current
            occupancy state.
          </div>
        </div>
      </div>
    `;
  }
  _describeActionRule(t) {
    const e = t.trigger_type === "occupied" ? "occupied" : "vacant", i = t.action_service || "run", o = t.action_entity_id || "target";
    return `When ${e} -> ${i} ${o}`;
  }
  _workingSources(t) {
    return this._stagedSources ? [...this._stagedSources] : [...t.occupancy_sources || []];
  }
  _setWorkingSources(t, e) {
    const i = e.map((a) => this._normalizeSource(a.entity_id, a)), o = { ...this._onTimeoutMemory };
    for (const a of i)
      typeof a.on_timeout == "number" && a.on_timeout > 0 && (o[this._sourceKeyFromSource(a)] = a.on_timeout);
    this._onTimeoutMemory = o, this._stagedSources = i, this._sourcesDirty = !0, this.requestUpdate();
  }
  _updateSourceDraft(t, e, i) {
    const o = this._workingSources(t), a = o[e];
    if (!a) return;
    const r = this._modeOptionsForEntity(a.entity_id).map((c) => c.value), s = this._normalizeSource(
      a.entity_id,
      {
        ...i,
        mode: r.includes(i.mode) ? i.mode : r[0]
      }
    );
    o[e] = s, this._setWorkingSources(t, o);
  }
  _removeSource(t, e) {
    const i = this._workingSources(e), o = i[t];
    if (!o) return;
    i.splice(t, 1);
    const a = { ...this._onTimeoutMemory };
    delete a[this._sourceKeyFromSource(o)], this._onTimeoutMemory = a, this._setWorkingSources(e, i);
  }
  _addSourceWithDefaults(t, e, i) {
    if (!this.location || this._isFloorLocation()) return;
    const o = this._workingSources(e), a = this._sourceKey(t, i == null ? void 0 : i.signalKey);
    if (o.some((u) => this._sourceKeyFromSource(u) === a))
      return;
    const r = this.hass.states[t];
    if (!r) {
      this._showToast(`Entity not found: ${t}`, "error");
      return;
    }
    let c = so(r);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? c = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (c = this._lightSignalDefaults(t, i.signalKey));
    const l = this._normalizeSource(t, c);
    this._setWorkingSources(e, [...o, l]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate());
  }
  async _persistOccupancySources(t) {
    if (!this.location) return;
    const e = this._getOccupancyConfig();
    this._savingSource = !0, this.requestUpdate();
    try {
      await this._updateConfig({
        ...e,
        occupancy_sources: t
      });
    } finally {
      this._savingSource = !1, this.requestUpdate();
    }
  }
  _normalizeSource(t, e) {
    var d;
    const i = this._isMediaEntity(t), o = this._isDimmableEntity(t), a = this._isColorCapableEntity(t), r = (d = e.source_id) != null && d.includes("::") ? e.source_id.split("::")[1] : void 0, s = this._defaultSignalKeyForEntity(t), c = e.signal_key || r || s;
    let l;
    (i && (c === "playback" || c === "volume" || c === "mute") || (o || a) && (c === "power" || c === "level" || c === "color")) && (l = c);
    const u = e.source_id || this._sourceKey(t, l);
    return {
      entity_id: t,
      source_id: u,
      signal_key: l,
      mode: e.mode || "any_change",
      on_event: e.on_event || "trigger",
      on_timeout: e.on_timeout,
      off_event: e.off_event || "none",
      off_trailing: e.off_trailing ?? 0
    };
  }
  _getOccupancyConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.occupancy) || {};
  }
  _getAutomationConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.automation) || {};
  }
  async _updateAutomationConfig(t) {
    await this._updateModuleConfig("automation", t);
  }
  _availableSourceAreas() {
    var o, a;
    const t = (o = this.location) == null ? void 0 : o.ha_area_id, e = ((a = this.hass) == null ? void 0 : a.areas) || {};
    return Object.values(e).filter((r) => !!r.area_id).filter((r) => r.area_id !== t).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, s) => r.name.localeCompare(s.name));
  }
  _entitiesForArea(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    return t === "__all__" ? Object.keys(e).filter((o) => this._isCandidateEntity(o)).sort((o, a) => this._entityName(o).localeCompare(this._entityName(a))) : Object.keys(e).filter((o) => {
      var r, s;
      const a = this._entityAreaById[o];
      return a !== void 0 ? a === t : ((s = (r = e[o]) == null ? void 0 : r.attributes) == null ? void 0 : s.area_id) === t;
    }).filter((o) => this._isCandidateEntity(o)).sort((o, a) => this._entityName(o).localeCompare(this._entityName(a)));
  }
  _isCandidateEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = e.attributes || {};
    if (i.device_class === "occupancy" && i.location_id) return !1;
    const o = t.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(o))
      return !0;
    if (o === "binary_sensor") {
      const s = String(i.device_class || "");
      return s ? [
        "motion",
        "occupancy",
        "presence",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock"
      ].includes(s) : !0;
    }
    return !1;
  }
  _getOccupancyState() {
    var e;
    if (!this.location) return;
    const t = ((e = this.hass) == null ? void 0 : e.states) || {};
    for (const i of Object.values(t)) {
      const o = (i == null ? void 0 : i.attributes) || {};
      if (o.device_class === "occupancy" && o.location_id === this.location.id)
        return i;
    }
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, o = e.lock_modes, a = e.direct_locks, r = Array.isArray(i) ? i.map((l) => String(l)) : [], s = Array.isArray(o) ? o.map((l) => String(l)) : [], c = Array.isArray(a) ? a.map((l) => ({
      sourceId: String((l == null ? void 0 : l.source_id) || "unknown"),
      mode: String((l == null ? void 0 : l.mode) || "freeze"),
      scope: String((l == null ? void 0 : l.scope) || "self")
    })).sort(
      (l, u) => `${l.sourceId}:${l.mode}:${l.scope}`.localeCompare(`${u.sourceId}:${u.mode}:${u.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: r,
      lockModes: s,
      directLocks: c
    };
  }
  _resolveVacantAt(t, e) {
    if (!e) return;
    const i = this._parseDateValue(t.vacant_at) || this._parseDateValue(t.effective_timeout_at);
    if (i)
      return i;
    const o = Array.isArray(t.contributions) ? t.contributions : [];
    if (!o.length)
      return;
    let a = !1, r;
    for (const s of o) {
      const c = s == null ? void 0 : s.expires_at;
      if (c == null) {
        a = !0;
        continue;
      }
      const l = this._parseDateValue(c);
      l && (!r || l.getTime() > r.getTime()) && (r = l);
    }
    return a ? null : r;
  }
  _parseDateValue(t) {
    if (typeof t != "string" || !t) return;
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? void 0 : e;
  }
  _formatDateTime(t) {
    return new Intl.DateTimeFormat(void 0, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(t);
  }
  _formatRelativeDuration(t) {
    const e = Math.max(0, Math.floor((t.getTime() - this._nowEpochMs) / 1e3));
    if (e <= 0) return "now";
    const i = Math.floor(e / 86400), o = Math.floor(e % 86400 / 3600), a = Math.floor(e % 3600 / 60), r = e % 60, s = [];
    return i > 0 && s.push(`${i}d`), o > 0 && s.push(`${o}h`), a > 0 && s.length < 2 && s.push(`${a}m`), (s.length === 0 || i === 0 && o === 0 && a === 0) && s.push(`${r}s`), s.slice(0, 2).join(" ");
  }
  _lockModeLabel(t) {
    return t === "block_occupied" ? "Block occupied" : t === "block_vacant" ? "Block vacant" : "Freeze";
  }
  _lockScopeLabel(t) {
    return t === "subtree" ? "Subtree" : "Self";
  }
  _startClockTicker() {
    this._clockTimer === void 0 && (this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1e3));
  }
  _stopClockTicker() {
    this._clockTimer !== void 0 && (window.clearInterval(this._clockTimer), this._clockTimer = void 0);
  }
  _describeSource(t, e) {
    const i = t.mode === "any_change" ? "Any change" : "Specific states", o = t.on_timeout === null ? null : t.on_timeout ?? e, a = t.off_trailing ?? 0, r = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(o)})` : "ON: ignore", s = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(a)})` : "OFF: ignore";
    return `${i} • ${r} • ${s}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], o = t.on_timeout === null ? null : t.on_timeout ?? e, a = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(m`<span class="event-chip">ON -> trigger (${this._formatDuration(o)})</span>`) : i.push(m`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      m`<span class="event-chip off">OFF -> clear (${this._formatDuration(a)})</span>`
    ) : i.push(m`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t], i = (e == null ? void 0 : e.attributes) || {}, o = t.split(".", 1)[0], a = String(i.device_class || "");
    return o === "person" || o === "device_tracker" ? [{ value: "specific_states", label: "Specific states" }] : o === "binary_sensor" ? ["door", "garage_door", "opening", "window", "motion", "presence", "occupancy"].includes(a) ? [{ value: "specific_states", label: "Specific states" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ] : ["light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(o) ? [{ value: "any_change", label: "Any change" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ];
  }
  _supportsOffBehavior(t) {
    const e = t.entity_id.split(".", 1)[0];
    return !(e === "media_player" && (t.signal_key === "volume" || t.signal_key === "mute") || e === "light" && (t.signal_key === "level" || t.signal_key === "color"));
  }
  _eventLabelsForSource(t) {
    var l, u;
    const e = t.entity_id, i = (u = (l = this.hass) == null ? void 0 : l.states) == null ? void 0 : u[e], o = (i == null ? void 0 : i.attributes) || {}, a = e.split(".", 1)[0], r = String(o.device_class || "");
    let s = "ON", c = "OFF";
    if (a === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(r))
      s = "Open", c = "Closed";
    else if (a === "binary_sensor" && r === "motion")
      s = "Motion", c = "No motion";
    else if (a === "binary_sensor" && ["presence", "occupancy"].includes(r))
      s = "Detected", c = "Not detected";
    else if (a === "person" || a === "device_tracker")
      s = "Home", c = "Away";
    else {
      if (a === "media_player")
        return t.signal_key === "volume" ? {
          onState: "Volume change",
          offState: "No volume change",
          onBehavior: "Volume change behavior",
          onTimeout: "Volume timeout",
          offBehavior: "No-volume behavior",
          offDelay: "No-volume delay"
        } : t.signal_key === "mute" ? {
          onState: "Mute change",
          offState: "No mute change",
          onBehavior: "Mute change behavior",
          onTimeout: "Mute timeout",
          offBehavior: "No-mute behavior",
          offDelay: "No-mute delay"
        } : {
          onState: "Playing",
          offState: "Paused/idle",
          onBehavior: "Playing behavior",
          onTimeout: "Playing timeout",
          offBehavior: "Paused/idle behavior",
          offDelay: "Paused/idle delay"
        };
      if (a === "light" && t.signal_key === "level")
        return {
          onState: "Level change",
          offState: "No level change",
          onBehavior: "Level change behavior",
          onTimeout: "Level timeout",
          offBehavior: "No-level behavior",
          offDelay: "No-level delay"
        };
      if (a === "light" && t.signal_key === "color")
        return {
          onState: "Color change",
          offState: "No color change",
          onBehavior: "Color change behavior",
          onTimeout: "Color timeout",
          offBehavior: "No-color behavior",
          offDelay: "No-color delay"
        };
      (a === "light" && t.signal_key === "power" || a === "light" || a === "switch" || a === "fan") && (s = "On", c = "Off");
    }
    return {
      onState: s,
      offState: c,
      onBehavior: `${s} behavior`,
      onTimeout: `${s} timeout`,
      offBehavior: `${c} behavior`,
      offDelay: `${c} delay`
    };
  }
  _formatDuration(t) {
    return t === null ? "indefinite" : !t || t <= 0 ? "0m" : `${Math.floor(t / 60)}m`;
  }
  _entityName(t) {
    var e, i;
    return ((i = (e = this.hass.states[t]) == null ? void 0 : e.attributes) == null ? void 0 : i.friendly_name) || t;
  }
  _entityState(t) {
    var i;
    const e = (i = this.hass.states[t]) == null ? void 0 : i.state;
    return e || "unknown";
  }
  async _handleTestSource(t, e) {
    if (!(!this.location || this._isFloorLocation()))
      try {
        if (e === "trigger") {
          const a = (this.location.modules.occupancy || {}).default_timeout || 300, r = t.on_timeout === null ? a : t.on_timeout ?? a, s = t.source_id || t.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "topomation",
            service: "trigger",
            service_data: {
              location_id: this.location.id,
              source_id: s,
              timeout: r
            }
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: s,
                timeout: r
              },
              bubbles: !0,
              composed: !0
            })
          ), this._showToast(`Triggered ${s}`, "success");
          return;
        }
        const i = t.off_trailing ?? 0, o = t.source_id || t.entity_id;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: "clear",
          service_data: {
            location_id: this.location.id,
            source_id: o,
            trailing_timeout: i
          }
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "clear",
              locationId: this.location.id,
              sourceId: o,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        ), this._showToast(`Cleared ${o}`, "success");
      } catch (i) {
        console.error("Failed to test source event:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to run source test", "error");
      }
  }
  _showToast(t, e = "success") {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message: t,
          type: e === "error" ? "error" : void 0
        },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _handleAddRule(t = "occupied") {
    this.dispatchEvent(
      new CustomEvent("add-rule", {
        detail: { trigger_type: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _handleDeleteRule(t) {
    if (confirm(`Delete automation "${t.name}"?`))
      try {
        await Hn(this.hass, t.id), this._showToast(`Deleted automation "${t.name}"`, "success"), await this._loadActionRules();
      } catch (e) {
        console.error("Failed to delete automation rule:", e), this._showToast((e == null ? void 0 : e.message) || "Failed to delete automation", "error");
      }
  }
  async _handleToggleRule(t) {
    const e = !t.enabled;
    try {
      await Un(this.hass, t, e), this._showToast(
        `${e ? "Enabled" : "Disabled"} automation "${t.name}"`,
        "success"
      ), await this._loadActionRules();
    } catch (i) {
      console.error("Failed to toggle automation rule:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to update automation state", "error");
    }
  }
  async _updateModuleConfig(t, e) {
    if (this.location)
      try {
        await this.hass.callWS({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: t,
          config: e
        }), this.location.modules[t] = e, this.requestUpdate();
      } catch (i) {
        console.error("Failed to update config:", i), alert("Failed to update configuration");
      }
  }
  _toggleEnabled(t) {
    if (!this.location || this._isFloorLocation()) return;
    const e = this.location.modules.occupancy || {}, i = !(e.enabled ?? !0);
    this._updateConfig({ ...e, enabled: i });
  }
  _handleTimeoutSliderInput(t) {
    const e = t.target, i = e.closest(".config-value");
    if (!i) return;
    const o = i.querySelector("input.input");
    o && (o.value = e.value);
  }
  _handleTimeoutChange(t) {
    const e = t.target, i = parseInt(e.value, 10);
    if (Number.isNaN(i)) return;
    const o = Math.max(1, Math.min(120, i));
    e.value = String(o);
    const a = o * 60, r = e.closest(".config-value");
    if (r) {
      const c = r.querySelector("input.timeout-slider");
      c && (c.value = String(o));
      const l = r.querySelector("input.input");
      l && (l.value = String(o));
    }
    if (!this.location || this._isFloorLocation()) return;
    const s = this.location.modules.occupancy || {};
    this._updateConfig({ ...s, default_timeout: a });
  }
  async _updateConfig(t) {
    await this._updateModuleConfig("occupancy", t);
  }
  _isFloorLocation() {
    return !!this.location && st(this.location) === "floor";
  }
};
ye.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  forcedTab: { type: String }
}, ye.styles = [
  Gt,
  Tt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .inspector-container {
        padding: var(--spacing-md);
      }

      .header {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color);
        border-radius: 50%;
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        --mdc-icon-size: 32px;
      }

      .header-content {
        flex: 1;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .location-id {
        font-size: 13px;
        font-family: var(--code-font-family, monospace);
        color: var(--secondary-text-color);
        margin-top: 4px;
        opacity: 0.8;
      }

      .id-label {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 10px;
        margin-right: 4px;
        letter-spacing: 0.5px;
      }

      .card-section {
        background: var(--card-background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--divider-color);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        max-width: 900px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary-text-color);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: all var(--transition-speed);
      }

      .tab:hover {
        color: var(--text-primary-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        padding: var(--spacing-md) 0;
      }

      .config-row {
        display: grid;
        grid-template-columns: minmax(220px, 320px) minmax(120px, max-content);
        align-items: center;
        justify-content: start;
        column-gap: 16px;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .settings-grid {
        max-width: 620px;
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-help {
        margin-top: 3px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .startup-config-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .startup-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .startup-config-row .config-help {
        margin-top: 0;
        max-width: 700px;
        line-height: 1.45;
      }

      .startup-config-row .config-value {
        flex: 0 0 auto;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .switch-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .timeout-slider {
        width: 240px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        max-width: 820px;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        max-width: 820px;
      }

      .contribution-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
      }

      .contribution-cell {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        padding: 8px;
      }

      .contribution-label {
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .contribution-value {
        font-size: 16px;
        font-weight: 700;
      }

      .source-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
      }

      .source-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .source-info {
        flex: 1;
      }

      .source-name {
        font-size: 14px;
        font-weight: 500;
      }

      .source-details {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-top: var(--spacing-xs);
      }

      .source-events {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color);
      }

      .event-chip.off {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .event-chip.ignore {
        background: rgba(var(--rgb-disabled-color, 120, 120, 120), 0.18);
        color: var(--text-secondary-color);
      }

      .policy-note {
        font-size: 13px;
        color: var(--text-secondary-color);
        line-height: 1.45;
      }

      .policy-warning {
        margin-top: var(--spacing-sm);
        font-size: 12px;
        color: var(--warning-color);
      }

      .lock-banner {
        margin: 0 0 var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        border-radius: 8px;
        background: rgba(var(--rgb-warning-color), 0.1);
      }

      .lock-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--warning-color);
      }

      .lock-details {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .runtime-grid {
        display: grid;
        row-gap: 8px;
        margin-bottom: var(--spacing-md);
      }

      .runtime-row {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        align-items: center;
        column-gap: 12px;
      }

      .runtime-key {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .runtime-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .runtime-note {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .lock-directive-list {
        margin-top: 8px;
        display: grid;
        gap: 6px;
      }

      .lock-directive {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: var(--primary-text-color);
      }

      .lock-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(var(--rgb-warning-color), 0.35);
        border-radius: 999px;
        padding: 2px 8px;
        color: var(--warning-color);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .subsection-header {
        margin-top: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .source-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .source-card.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.25);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 10px 12px;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .candidate-item:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .candidate-submeta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .candidate-headline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .inline-mode-select {
        min-width: 180px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .inline-mode-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .inline-mode-label {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .source-enable-control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .source-enable-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .source-enable-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.4);
        outline-offset: 2px;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.25px;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 3px 8px;
        border: 1px solid var(--divider-color);
        color: var(--text-secondary-color);
      }

      .status-pill.active {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .source-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        white-space: nowrap;
      }

      .mini-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }

      .source-editor {
        margin: 0;
        border: none;
        border-top: 1px solid rgba(var(--rgb-primary-color), 0.2);
        border-radius: 0;
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 10px 12px;
      }

      .media-signals {
        margin-bottom: 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .editor-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-field label {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-weight: 600;
      }

      .editor-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .editor-field select,
      .editor-field input[type="number"] {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-timeout {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .editor-timeout input[type="range"] {
        flex: 1;
      }

      .editor-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        max-width: 820px;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        max-width: 820px;
        margin-bottom: 10px;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .mini-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Ensure buttons are always visible */
      .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .empty-state {
        color: var(--text-secondary-color, #757575) !important;
      }

      .empty-state .button {
        margin-top: var(--spacing-md);
      }

      @media (max-width: 900px) {
        .contribution-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }

        .startup-config-row {
          gap: 10px;
        }

        .startup-config-header {
          align-items: flex-start;
        }

        .editor-grid {
          grid-template-columns: 1fr;
        }

        .external-composer {
          grid-template-columns: 1fr;
        }
      }
    `
];
let Ve = ye;
if (!customElements.get("ht-location-inspector"))
  try {
    console.log("[ht-location-inspector] registering custom element"), customElements.define("ht-location-inspector", Ve);
  } catch (n) {
    console.error("[ht-location-inspector] failed to define element", n);
  }
console.log("[ht-location-dialog] module loaded");
var Oi, Mi;
try {
  (Mi = (Oi = import.meta) == null ? void 0 : Oi.hot) == null || Mi.accept(() => window.location.reload());
} catch {
}
const be = class be extends Y {
  constructor() {
    super(...arguments), this.open = !1, this.locations = [], this._config = {
      name: "",
      type: "area"
    }, this._submitting = !1, this._computeLabel = (t) => ({
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Location Icon (optional)"
    })[t.name] || t.name;
  }
  /**
   * Performance: Dialog is short-lived, minimal hass filtering needed
   */
  willUpdate(t) {
    var e, i, o;
    if (t.has("open")) {
      const a = t.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", a, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((r) => {
        var s, c;
        return `${r.name}(${(c = (s = r.modules) == null ? void 0 : s._meta) == null ? void 0 : c.type})`;
      })), this.open && !a) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const r = ((e = this.location.modules) == null ? void 0 : e._meta) || {}, s = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (o = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : o.icon : void 0;
          this._config = {
            name: this.location.name,
            type: r.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: s || void 0
          };
        } else {
          const r = this.defaultType ?? "area", s = this.defaultParentId;
          this._config = {
            name: "",
            type: r,
            parent_id: s || void 0
          };
        }
        this._error = void 0;
      }
    }
  }
  updated(t) {
    super.updated(t), t.has("open") && this.open && this.updateComplete.then(() => {
      setTimeout(() => {
        var o, a;
        const e = (o = this.shadowRoot) == null ? void 0 : o.querySelector("ha-form");
        if (e != null && e.shadowRoot) {
          const r = e.shadowRoot.querySelector('input[type="text"]');
          if (r) {
            console.log("[LocationDialog] Focusing input:", r), r.focus(), r.select();
            return;
          }
        }
        const i = (a = this.shadowRoot) == null ? void 0 : a.querySelector('input[type="text"]');
        i && (console.log("[LocationDialog] Focusing fallback input:", i), i.focus(), i.select());
      }, 150);
    });
  }
  render() {
    console.log("[LocationDialog] render() called, open:", this.open);
    const t = this._getSchema();
    return console.log("[LocationDialog] Rendering dialog with schema:", t.length, "fields"), m`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? m`
            <div class="error-message">${this._error}</div>
          ` : ""}

        <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${t}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>
        </div>

        <ha-button
          slot="secondaryAction"
          .dialogAction=${"cancel"}
          @click=${this._handleCancel}
          ?disabled=${this._submitting}
        >
          Cancel
        </ha-button>
        <ha-button
          slot="primaryAction"
          .dialogAction=${"confirm"}
          @click=${this._handleSubmit}
          ?disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.location ? "Save" : "Create"}
        </ha-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const t = this._getValidParents(), e = this._includeRootOption(), i = e || t.length > 1;
    console.log("[LocationDialog] parentOptions:", t), this.location;
    const o = [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        // NOTE: "type" is integration metadata (stored in modules._meta), NOT a kernel property.
        // The kernel is type-agnostic. Types are used by the UI to enforce hierarchy rules
        // and map sensible defaults to HA areas.
        name: "type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "floor", label: "Floor" },
              { value: "area", label: "Area" },
              { value: "building", label: "Building" },
              { value: "grounds", label: "Grounds" },
              { value: "subarea", label: "Subarea" }
            ]
          }
        }
      }
    ];
    return i && o.push({
      name: "parent_id",
      selector: {
        select: {
          options: [
            ...e ? [{ value: "", label: "(Root Level)" }] : [],
            ...t
          ]
        }
      }
    }), o.push({
      name: "icon",
      selector: { icon: {} }
    }), o;
  }
  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/history/2026.02.24-ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Floors can be root-level or children of Building only
   * - Building/Grounds wrappers are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  _getValidParents() {
    const t = this._config.type, e = We(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const o = e.filter((r) => r !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: o,
      totalLocations: this.locations.length
    }), o.length === 0) return [];
    const a = this.locations.filter((r) => {
      if (r.is_explicit_root) return !1;
      const s = st(r);
      return o.includes(s);
    }).map((r) => ({
      value: r.id,
      label: r.name
    }));
    return console.log("[LocationDialog] Valid parents:", a.length, a.map((r) => r.label)), a;
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = We(this._config.type);
    if (t.length === 1 && t[0] === "root") return null;
    const i = String(this._config.parent_id || "").trim();
    if (i) return i;
    const o = this._getValidParents();
    return o.length === 1 ? String(o[0].value) : null;
  }
  _handleValueChanged(t) {
    console.log("[LocationDialog] value-changed received:", t.detail), this._config = { ...this._config, ...t.detail.value }, console.log("[LocationDialog] Updated config:", this._config), this._error = void 0, this.requestUpdate();
  }
  _isValid() {
    return !!this._config.name && !!this._config.type;
  }
  _formatSaveError(t) {
    const e = String((t == null ? void 0 : t.message) || t || "Failed to save location"), i = e.toLowerCase();
    return i.includes("location lifecycle mutations are disabled in this adapter") || i.includes("create/rename/delete floors and areas") ? "Legacy policy error detected. Restart Home Assistant and hard refresh the browser to load updated location create/update support." : e;
  }
  async _handleSubmit() {
    if (console.log("[LocationDialog] Submit clicked, config:", this._config), console.log("[LocationDialog] isValid:", this._isValid(), "submitting:", this._submitting), !this._isValid() || this._submitting) {
      console.log("[LocationDialog] Submit blocked - invalid or already submitting");
      return;
    }
    this._submitting = !0, this._error = void 0;
    try {
      this.location ? (await this.hass.callWS({
        type: "topomation/locations/update",
        location_id: this.location.id,
        changes: {
          name: this._config.name,
          parent_id: this._submitParentId()
        }
      }), await this.hass.callWS({
        type: "topomation/locations/set_module_config",
        location_id: this.location.id,
        module_id: "_meta",
        config: {
          type: this._config.type
        }
      })) : await this.hass.callWS({
        type: "topomation/locations/create",
        name: this._config.name,
        parent_id: this._submitParentId(),
        meta: {
          type: this._config.type
        }
      }), this.dispatchEvent(new CustomEvent("saved", {
        detail: {
          name: this._config.name,
          type: this._config.type,
          parent_id: this._config.parent_id,
          meta: {
            type: this._config.type
          }
        },
        bubbles: !0,
        composed: !0
      })), this.open = !1;
    } catch (t) {
      console.error("Failed to save location:", t), this._error = this._formatSaveError(t);
    } finally {
      this._submitting = !1;
    }
  }
  _handleCancel() {
    console.log("[LocationDialog] Cancel clicked"), this.open = !1, this._handleClosed();
  }
  _handleClosed() {
    console.log("[LocationDialog] Closed event fired"), this.open = !1, this._error = void 0, this._submitting = !1, this._config = {
      name: "",
      type: "area"
    }, this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: !0,
      composed: !0
    }));
  }
};
be.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  defaultParentId: { attribute: !1 },
  defaultType: { attribute: !1 },
  // Internal state - also needs explicit declaration for Vite
  _config: { state: !0 },
  _submitting: { state: !0 },
  _error: { state: !0 }
}, be.styles = [
  Gt,
  Tt`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let Ke = be;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", Ke);
console.log("[ht-rule-dialog] module loaded");
const ii = class ii extends Y {
  constructor() {
    super(...arguments), this.open = !1, this._config = {}, this._submitting = !1, this._computeLabel = (t) => ({
      name: "Rule Name",
      trigger_type: "Trigger When",
      action_entity_id: "Target Entity",
      action_service: "Action"
    })[t.name] || t.name;
  }
  willUpdate(t) {
    t.has("open") && this.open && (this.rule ? this._config = { ...this.rule } : this._config = {
      id: `rule-${Date.now()}`,
      name: "",
      trigger_type: this.defaultTriggerType || "occupied",
      action_entity_id: "",
      action_service: "turn_on"
    }, this._error = void 0);
  }
  render() {
    if (!this.open) return m``;
    const t = this._getSchema();
    return m`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${this.rule ? "Edit Home Assistant Automation" : "New Home Assistant Automation"}
      >
        <div class="dialog-content">
          ${this._error ? m`<div class="error-message">${this._error}</div>` : ""}

          <ha-form
            .hass=${this.hass}
            .data=${this._getFormData()}
            .schema=${t}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>

          ${this._renderPreview()}
        </div>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleCancel}
          .disabled=${this._submitting}
        >
          Cancel
        </mwc-button>
        <mwc-button
          slot="primaryAction"
          @click=${this._handleSubmit}
          .disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.rule ? "Save" : "Create"}
        </mwc-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    return [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        name: "trigger_type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "occupied", label: "When Occupied" },
              { value: "vacant", label: "When Vacant" }
            ]
          }
        }
      },
      {
        name: "action_entity_id",
        required: !0,
        selector: {
          entity: {}
        }
      },
      {
        name: "action_service",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "turn_on", label: "Turn On" },
              { value: "turn_off", label: "Turn Off" },
              { value: "toggle", label: "Toggle" }
            ]
          }
        }
      }
    ];
  }
  _getFormData() {
    return {
      name: this._config.name || "",
      trigger_type: this._config.trigger_type || "occupied",
      action_entity_id: this._config.action_entity_id || "",
      action_service: this._config.action_service || "turn_on"
    };
  }
  _handleValueChanged(t) {
    const e = t.detail.value;
    this._config = {
      ...this._config,
      name: e.name,
      trigger_type: e.trigger_type,
      action_entity_id: e.action_entity_id,
      action_service: e.action_service
    };
  }
  _renderPreview() {
    var a, r;
    if (!this._config.name || !this._config.action_entity_id)
      return m``;
    const t = this.hass.states[this._config.action_entity_id], e = (t == null ? void 0 : t.attributes.friendly_name) || this._config.action_entity_id, i = this._config.trigger_type === "occupied" ? "becomes occupied" : "becomes vacant", o = (a = this._config.action_service) == null ? void 0 : a.replace("_", " ");
    return m`
      <div class="preview">
        <div class="preview-label">Preview</div>
        <div class="preview-text">
          When <strong>${((r = this.location) == null ? void 0 : r.name) || "this location"}</strong>
          ${i}, <strong>${o}</strong>
          <strong>${e}</strong>
        </div>
      </div>
    `;
  }
  _isValid() {
    return !!(this._config.name && this._config.trigger_type && this._config.action_entity_id && this._config.action_service);
  }
  async _handleSubmit() {
    if (!(!this.location || !this._isValid() || this._submitting)) {
      if (this.rule) {
        this._error = "Editing existing rules is not supported here yet. Use the automation editor.";
        return;
      }
      this._submitting = !0, this._error = void 0;
      try {
        const t = await zn(this.hass, {
          location: this.location,
          name: this._config.name,
          trigger_type: this._config.trigger_type,
          action_entity_id: this._config.action_entity_id,
          action_service: this._config.action_service
        });
        this.dispatchEvent(
          new CustomEvent("rule-saved", {
            detail: { rule: t },
            bubbles: !0,
            composed: !0
          })
        ), this.open = !1;
      } catch (t) {
        console.error("Failed to save rule:", t), this._error = t.message || "Failed to save rule";
      } finally {
        this._submitting = !1;
      }
    }
  }
  _handleCancel() {
    this.open = !1;
  }
  _handleClosed() {
    this.open = !1, this.dispatchEvent(
      new CustomEvent("dialog-closed", {
        bubbles: !0,
        composed: !0
      })
    );
  }
};
ii.styles = [
  Gt,
  Tt`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .preview {
        padding: 16px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        margin-top: 16px;
        font-size: 14px;
      }

      .preview-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preview-text {
        color: var(--primary-text-color);
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let je = ii;
customElements.get("ht-rule-dialog") || customElements.define("ht-rule-dialog", je);
console.log("[topomation-panel] module loaded");
var Pi, Ni;
try {
  (Ni = (Pi = import.meta) == null ? void 0 : Pi.hot) == null || Ni.accept(() => window.location.reload());
} catch {
}
const we = class we extends Y {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._ruleDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._hasLoaded = !1, this._loadSeq = 0, this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleNewLocation = (t) => {
      t && (t.preventDefault(), t.stopPropagation()), this._editingLocation = void 0, this._newLocationDefaults = {
        parentId: null,
        type: "building"
      }, this._locationDialogOpen = !0;
    }, this._handleDeleteSelected = (t) => {
      t && (t.preventDefault(), t.stopPropagation());
      const e = this._getSelectedLocation();
      if (!e) {
        this._showToast("Select a location to delete", "warning");
        return;
      }
      if (!this._canDeleteLocation(e)) {
        this._showToast(this._deleteDisabledReason(e), "warning");
        return;
      }
      confirm(`Delete "${e.name}"?`) && this._handleLocationDelete(
        new CustomEvent("location-delete", {
          detail: { location: e }
        })
      );
    }, this._handleKeyDown = (t) => {
      (t.ctrlKey || t.metaKey) && t.key === "s" && (t.preventDefault(), this._pendingChanges.size > 0 && !this._saving && this._handleSaveChanges()), (t.ctrlKey || t.metaKey) && t.key === "z" && !t.shiftKey && (t.preventDefault(), console.log("Undo requested")), (t.ctrlKey || t.metaKey) && (t.key === "y" || t.key === "z" && t.shiftKey) && (t.preventDefault(), console.log("Redo requested")), t.key === "Escape" && this._pendingChanges.size > 0 && !this._saving && confirm("Discard all pending changes?") && this._handleDiscardChanges(), t.key === "?" && !t.ctrlKey && !t.metaKey && this._showKeyboardShortcutsHelp();
    }, this._toggleEventLog = () => {
      this._eventLogOpen = !this._eventLogOpen;
    }, this._clearEventLog = () => {
      this._eventLogEntries = [];
    }, this._handleSourceTest = (t) => {
      this._logEvent("ui", "source test", t.detail);
    }, this._toggleEventLogScope = () => {
      this._eventLogScope = this._eventLogScope === "subtree" ? "all" : "subtree", this._logEvent(
        "ui",
        `event log scope set to ${this._eventLogScope === "subtree" ? "selected subtree" : "all locations"}`
      );
    }, console.log("TopomationPanel constructed");
  }
  _enqueueLocationOp(t, e) {
    const o = (this._opQueueByLocationId.get(t) ?? Promise.resolve()).catch(() => {
    }).then(e);
    return this._opQueueByLocationId.set(t, o), o;
  }
  _scheduleReload(t = !0) {
    this._reloadTimer && (window.clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = void 0, this._loadLocations(t);
    }, 150);
  }
  willUpdate(t) {
    super.willUpdate(t), !this._hasLoaded && this.hass && (this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations()), t.has("hass") && this.hass && this._subscribeToUpdates();
  }
  connectedCallback() {
    super.connectedCallback(), console.log("TopomationPanel connected"), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(t) {
    super.updated(t);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0);
  }
  /**
   * CRITICAL PERFORMANCE: Filter hass updates to prevent unnecessary re-renders.
   * Without this, component re-renders on EVERY state change in HA (100+ times/min).
   * See: docs/history/2026.02.24-frontend-patterns.md Section 1.1
   */
  shouldUpdate(t) {
    for (const e of t.keys())
      if (e !== "hass") return !0;
    if (t.has("hass")) {
      const e = t.get("hass");
      return !e || e.areas !== this.hass.areas;
    }
    return !0;
  }
  render() {
    if (this._loading && !this._locations.length)
      return m`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return m`
        <div class="error-container">
          <h3>Error Loading Topomation</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const t = this._locations.find(
      (c) => c.id === this._selectedId
    ), e = this._managerView(), i = this._managerHeader(e), o = e === "location" ? void 0 : e, a = e === "occupancy" ? "Occupancy" : e === "actions" ? "Actions" : "Location", r = t ? `${t.name} · ${t.id}` : "Select a location to configure modules", s = this._deleteDisabledReason(t);
    return m`
      <div class="panel-container">
        <div class="panel-left">
          ${this._renderPropertyContext()}
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${i.title}</div>
            <div class="header-subtitle">
              ${i.subtitle}
            </div>
            <div class="header-actions">
              ${m`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${s}
              >
                Delete Selected
              </button>
              <button class="button button-secondary" @click=${this._toggleEventLog}>
                ${this._eventLogOpen ? "Hide Log" : "Event Log"}
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .version=${this._locationsVersion}
            .selectedId=${this._selectedId}
            .occupancyStates=${this._occupancyStateByLocation}
            .readOnly=${!1}
            .allowMove=${!0}
            .allowRename=${!0}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
            @location-edit=${this._handleLocationEdit}
            @location-moved=${this._handleLocationMoved}
            @location-move-blocked=${this._handleLocationMoveBlocked}
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-occupancy-toggle=${this._handleLocationOccupancyToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
          ></ht-location-tree>
        </div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${a}</div>
            <div class="header-subtitle">${r}</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${t}
            .forcedTab=${o}
            @add-rule=${this._handleAddRule}
            @source-test=${this._handleSourceTest}
          ></ht-location-inspector>
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _renderPropertyContext() {
    var c;
    const t = (c = this.hass) == null ? void 0 : c.config;
    if (!t) return "";
    const e = String(t.location_name || "Home Assistant Property").trim(), i = typeof t.latitude == "number" ? t.latitude : void 0, o = typeof t.longitude == "number" ? t.longitude : void 0, a = t.time_zone ? String(t.time_zone) : "", r = t.country ? String(t.country) : "", s = [];
    return i !== void 0 && o !== void 0 && s.push(`${i.toFixed(4)}, ${o.toFixed(4)}`), a && s.push(a), r && s.push(r), m`
      <div class="property-context">
        <div class="property-context-title">Property</div>
        <div class="property-context-name">${e}</div>
        ${s.length ? m`<div class="property-context-meta">${s.join(" · ")}</div>` : ""}
      </div>
    `;
  }
  _managerViewFromPath(t) {
    return t.startsWith("/topomation-occupancy") ? "occupancy" : t.startsWith("/topomation-actions") ? "actions" : "location";
  }
  _managerView() {
    var e, i, o;
    const t = (i = (e = this.panel) == null ? void 0 : e.config) == null ? void 0 : i.topomation_view;
    return t === "location" || t === "occupancy" || t === "actions" ? t : (o = this.route) != null && o.path ? this._managerViewFromPath(this.route.path) : this._managerViewFromPath(window.location.pathname || "");
  }
  _managerHeader(t) {
    return t === "occupancy" ? {
      title: "Occupancy Manager",
      subtitle: "Locations are synced from Home Assistant Areas/Floors. Configure occupancy sources and timeout behavior here."
    } : t === "actions" ? {
      title: "Actions Manager",
      subtitle: "Locations are synced from Home Assistant Areas/Floors. Configure occupancy-driven Home Assistant automations here."
    } : {
      title: "Topomation",
      subtitle: "Manage locations and hierarchy here. Floors, areas, buildings, grounds, and subareas can all be created here."
    };
  }
  _renderDialogs() {
    var e, i;
    const t = this._getSelectedLocation();
    return m`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._locations}
        .defaultParentId=${(e = this._newLocationDefaults) == null ? void 0 : e.parentId}
        .defaultType=${(i = this._newLocationDefaults) == null ? void 0 : i.type}
        @dialog-closed=${() => {
      console.log("[Panel] Dialog closed event received"), this._locationDialogOpen = !1, this._editingLocation = void 0, this._newLocationDefaults = void 0;
    }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>

      <ht-rule-dialog
        .hass=${this.hass}
        .open=${this._ruleDialogOpen}
        .location=${t}
        .rule=${this._editingRule}
        .defaultTriggerType=${this._ruleDialogDefaultTriggerType}
        @dialog-closed=${() => {
      this._ruleDialogOpen = !1, this._editingRule = void 0, this._ruleDialogDefaultTriggerType = void 0;
    }}
        @rule-saved=${this._handleRuleSaved}
      ></ht-rule-dialog>
    `;
  }
  async _loadLocations(t = !1) {
    var o;
    const e = ++this._loadSeq, i = t || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      console.log("Calling WebSocket API: topomation/locations/list"), console.log("hass.callWS available:", typeof this.hass.callWS);
      const a = await Promise.race([
        this.hass.callWS({
          type: "topomation/locations/list"
        }),
        new Promise(
          (u, d) => setTimeout(() => d(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      console.log("WebSocket result:", a);
      const r = a;
      if (!r || !r.locations)
        throw new Error("Invalid response format: missing locations array");
      if (e !== this._loadSeq) {
        console.log("[Panel] Ignoring stale locations load", { seq: e, current: this._loadSeq });
        return;
      }
      const s = /* @__PURE__ */ new Map();
      for (const u of r.locations) s.set(u.id, u);
      const c = Array.from(s.values());
      c.length !== r.locations.length && console.warn("[Panel] Deduped locations from backend", {
        before: r.locations.length,
        after: c.length
      });
      const l = c.filter((u) => !u.is_explicit_root);
      l.length !== c.length && console.log("[Panel] Hidden explicit root locations from manager tree", {
        hidden: c.length - l.length
      }), this._locations = [...l], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._locationsVersion += 1, console.log("Loaded locations:", this._locations.length, this._locations), this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), (!this._selectedId || !this._locations.some((u) => u.id === this._selectedId)) && (this._selectedId = (o = this._locations[0]) == null ? void 0 : o.id);
    } catch (a) {
      console.error("Failed to load locations:", a), this._error = a.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (a == null ? void 0 : a.message) || a);
    } finally {
      this._loading = !1, this.requestUpdate();
    }
  }
  _scheduleInitialLoad() {
    if (!this._hasLoaded) {
      if (this.hass) {
        this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations();
        return;
      }
      this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
    }
  }
  _handleLocationSelected(t) {
    this._selectedId = t.detail.locationId;
  }
  /**
   * Render rename conflict notification banner
   */
  _renderEmptyStateBanner() {
    var i;
    const t = (i = this.hass) == null ? void 0 : i.navigate;
    return m`
      <div class="empty-state-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="empty-state-banner-content">
          <strong>Get started</strong>: Create your first location structure here.
          You can add floors, areas, buildings, grounds, and subareas, then manage hierarchy and occupancy.
        </div>
        <a href="/config/areas" class="button button-primary" @click=${(o) => {
      o.preventDefault(), typeof t == "function" ? t("/config/areas") : window.location.href = "/config/areas";
    }}>
          Open HA Areas/Floors
        </a>
      </div>
    `;
  }
  _renderConflictBanner() {
    if (!this._renameConflict)
      return "";
    const { locationId: t, localName: e, haName: i } = this._renameConflict, o = this._locations.find((a) => a.id === t);
    return m`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${(o == null ? void 0 : o.name) || t}" was renamed in Home Assistant to "${i}".
            Your local name is "${e}". Which name should we keep?
          </div>
        </div>
        <div class="conflict-actions">
          <button
            class="button button-text"
            @click=${() => this._handleConflictKeepLocal()}
          >
            Keep Local
          </button>
          <button
            class="button button-primary"
            @click=${() => this._handleConflictAcceptHA()}
          >
            Accept HA
          </button>
          <button
            class="button button-text"
            @click=${() => this._handleConflictDismiss()}
          >
            Dismiss
          </button>
        </div>
      </div>
    `;
  }
  _handleConflictKeepLocal() {
    if (!this._renameConflict) return;
    const { locationId: t, localName: e } = this._renameConflict;
    console.log(`[Panel] Keeping local name "${e}" for location ${t}`), this._renameConflict = void 0;
  }
  _handleConflictAcceptHA() {
    if (!this._renameConflict) return;
    const { locationId: t, haName: e } = this._renameConflict;
    console.log(`[Panel] Accepting HA name "${e}" for location ${t}`);
    const i = this._locations.find((o) => o.id === t);
    i && (i.name = e, this._locations = [...this._locations]), this._renameConflict = void 0;
  }
  _handleConflictDismiss() {
    console.log("[Panel] Dismissing rename conflict"), this._renameConflict = void 0;
  }
  _handleLocationCreate() {
    this._handleNewLocation();
  }
  _canDeleteLocation(t) {
    return !(!t || t.is_explicit_root);
  }
  _deleteDisabledReason(t) {
    return t ? t.is_explicit_root ? "Home root cannot be deleted" : "Delete selected location" : "Select a location to delete";
  }
  _handleLocationEdit(t) {
    var o;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = e ? this._locations.find((a) => a.id === e) : this._getSelectedLocation();
    if (!i) {
      this._showToast("Select a location to edit", "warning");
      return;
    }
    this._editingLocation = i, this._newLocationDefaults = void 0, this._locationDialogOpen = !0;
  }
  async _handleLocationMoved(t) {
    t.stopPropagation();
    const { locationId: e, newParentId: i, newIndex: o } = t.detail || {};
    if (!e || typeof o != "number") {
      this._showToast("Invalid move request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS({
          type: "topomation/locations/reorder",
          location_id: e,
          new_parent_id: i ?? null,
          new_index: o
        }), await this._loadLocations(!0), this._locationsVersion += 1;
      } catch (a) {
        console.error("Failed to move location:", a), this._showToast((a == null ? void 0 : a.message) || "Failed to move location", "error");
      }
    });
  }
  _handleLocationMoveBlocked(t) {
    var i;
    t.stopPropagation();
    const e = (i = t == null ? void 0 : t.detail) == null ? void 0 : i.reason;
    this._showToast(
      typeof e == "string" && e.trim() ? e : "That move is not allowed for this location.",
      "warning"
    );
  }
  async _handleLocationLockToggle(t) {
    var o, a;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((a = t == null ? void 0 : t.detail) != null && a.lock);
    if (!e) {
      this._showToast("Invalid lock request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var r;
      try {
        const s = i ? "lock" : "unlock";
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: s,
          service_data: {
            location_id: e,
            source_id: "manual_ui"
          }
        }), this._logEvent("ui", s, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1;
        const c = ((r = this._locations.find((l) => l.id === e)) == null ? void 0 : r.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${c}"`, "success");
      } catch (s) {
        console.error("Failed to toggle lock:", s), this._showToast((s == null ? void 0 : s.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if ((a == null ? void 0 : a.device_class) !== "occupancy" || String(a == null ? void 0 : a.location_id) !== String(t)) continue;
      const r = Array.isArray(a == null ? void 0 : a.locked_by) ? a.locked_by.map((s) => String(s)) : [];
      return {
        isLocked: !!(a != null && a.is_locked),
        lockedBy: r
      };
    }
    return { isLocked: !1, lockedBy: [] };
  }
  async _handleLocationOccupancyToggle(t) {
    var o, a;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((a = t == null ? void 0 : t.detail) != null && a.occupied);
    if (!e) {
      this._showToast("Invalid occupancy request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var u, d;
      const r = this._locations.find((h) => h.id === e), s = (r == null ? void 0 : r.name) || e, { isLocked: c, lockedBy: l } = this._getLocationLockState(e);
      if (c) {
        const h = l.length ? ` (${l.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${s}" is locked${h}.`, "warning");
        return;
      }
      try {
        if (!r) {
          this._showToast("Invalid occupancy request", "error");
          return;
        }
        const h = i ? "trigger" : "vacate_area", p = {
          location_id: e,
          source_id: "manual_ui"
        };
        if (i) {
          const f = (d = (u = r.modules) == null ? void 0 : u.occupancy) == null ? void 0 : d.default_timeout;
          typeof f == "number" && f >= 0 && (p.timeout = Math.floor(f));
        } else
          p.include_locked = !1;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: h,
          service_data: p
        }), this._logEvent("ui", h, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(
          i ? `Marked "${s}" as occupied` : `Marked "${s}" as unoccupied (vacated)`,
          "success"
        );
      } catch (h) {
        console.error("Failed to toggle occupancy:", h), this._showToast((h == null ? void 0 : h.message) || "Hey, can't do it.", "error");
      }
    });
  }
  async _handleLocationRenamed(t) {
    t.stopPropagation();
    const { locationId: e, newName: i } = t.detail || {};
    if (!e || !i) {
      this._showToast("Invalid rename request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS({
          type: "topomation/locations/update",
          location_id: e,
          changes: { name: String(i) }
        }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(`Renamed to "${i}"`, "success");
      } catch (o) {
        console.error("Failed to rename location:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to rename location", "error");
      }
    });
  }
  async _handleLocationDelete(t) {
    var i;
    t.stopPropagation();
    const e = (i = t == null ? void 0 : t.detail) == null ? void 0 : i.location;
    if (!(e != null && e.id)) {
      this._showToast("Invalid delete request", "error");
      return;
    }
    if (e.is_explicit_root) {
      this._showToast("Home root cannot be deleted", "warning");
      return;
    }
    await this._enqueueLocationOp(e.id, async () => {
      var o;
      try {
        const a = this._selectedId === e.id, r = e.parent_id ?? void 0;
        if (await this.hass.callWS({
          type: "topomation/locations/delete",
          location_id: e.id
        }), await this._loadLocations(!0), this._locationsVersion += 1, a) {
          const s = (r && this._locations.some((c) => c.id === r) ? r : (o = this._locations[0]) == null ? void 0 : o.id) ?? void 0;
          this._selectedId = s;
        }
        this._showToast(`Deleted "${e.name}"`, "success");
      } catch (a) {
        console.error("Failed to delete location:", a), this._showToast((a == null ? void 0 : a.message) || "Failed to delete location", "error");
      }
    });
  }
  async _handleLocationDialogSaved(t) {
    const e = t.detail;
    console.log("Location saved from dialog", e);
    const i = !!this._editingLocation;
    try {
      await this._loadLocations(!0), this._locationsVersion += 1, this._locationDialogOpen = !1, this._editingLocation = void 0, this._showToast(
        i ? `Updated "${e.name}"` : `Created "${e.name}"`,
        "success"
      );
    } catch (o) {
      console.error("Failed to reload locations:", o), this._showToast(`Failed to reload: ${o.message}`, "error");
    }
  }
  _handleAddRule(t) {
    var i;
    const e = (i = t == null ? void 0 : t.detail) == null ? void 0 : i.trigger_type;
    this._ruleDialogDefaultTriggerType = e === "vacant" ? "vacant" : "occupied", this._editingRule = void 0, this._ruleDialogOpen = !0;
  }
  async _handleRuleSaved(t) {
    const { rule: e } = t.detail;
    console.log("Rule saved", e), this._showToast(`Automation "${e.name}" saved`, "success"), await this._loadLocations(!0), this._ruleDialogOpen = !1, this._editingRule = void 0, this._ruleDialogDefaultTriggerType = void 0;
  }
  async _subscribeToUpdates() {
    if (!(!this.hass || !this.hass.connection)) {
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0);
      try {
        this._unsubUpdates = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_updated", (t == null ? void 0 : t.data) || {}), this._scheduleReload(!0);
          },
          "topomation_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_updated events", t), this._logEvent("error", "subscribe failed: topomation_updated", String(t));
      }
      try {
        this._unsubStateChanged = await this.hass.connection.subscribeEvents(
          (t) => {
            var s, c, l, u, d, h;
            const e = (s = t == null ? void 0 : t.data) == null ? void 0 : s.entity_id;
            if (!e) return;
            const i = (c = t == null ? void 0 : t.data) == null ? void 0 : c.new_state, o = (i == null ? void 0 : i.attributes) || {};
            if (e.startsWith("binary_sensor.") && o.device_class === "occupancy" && o.location_id && this._setOccupancyState(o.location_id, (i == null ? void 0 : i.state) === "on"), !this._shouldTrackEntity(e)) return;
            const a = (u = (l = t == null ? void 0 : t.data) == null ? void 0 : l.new_state) == null ? void 0 : u.state, r = (h = (d = t == null ? void 0 : t.data) == null ? void 0 : d.old_state) == null ? void 0 : h.state;
            this._logEvent("ha", "state_changed", { entityId: e, oldState: r, newState: a });
          },
          "state_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to state_changed events", t), this._logEvent("error", "subscribe failed: state_changed", String(t));
      }
      try {
        this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
          (t) => {
            var o, a;
            const e = (o = t == null ? void 0 : t.data) == null ? void 0 : o.location_id, i = (a = t == null ? void 0 : t.data) == null ? void 0 : a.occupied;
            !e || typeof i != "boolean" || (this._setOccupancyState(e, i), this._logEvent("ha", "topomation_occupancy_changed", { locationId: e, occupied: i }));
          },
          "topomation_occupancy_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_occupancy_changed events", t), this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(t));
      }
      try {
        this._unsubActionsSummary = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_actions_summary", (t == null ? void 0 : t.data) || {});
          },
          "topomation_actions_summary"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_actions_summary events", t), this._logEvent("error", "subscribe failed: topomation_actions_summary", String(t));
      }
    }
  }
  _setOccupancyState(t, e) {
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [t]: e
    };
  }
  _buildOccupancyStateMapFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if ((a == null ? void 0 : a.device_class) !== "occupancy") continue;
      const r = a.location_id;
      r && (t[r] = (o == null ? void 0 : o.state) === "on");
    }
    return t;
  }
  _renderEventLog() {
    return m`
      <div class="event-log">
        <div class="event-log-header">
          <span>
            Runtime Event Log (${this._eventLogEntries.length})
            <span class="event-log-meta">• ${this._getEventLogScopeLabel()}</span>
          </span>
          <div class="event-log-header-actions">
            <button class="button button-secondary" @click=${this._toggleEventLogScope}>
              ${this._eventLogScope === "subtree" ? "All locations" : "Selected subtree"}
            </button>
            <button class="button button-secondary" @click=${this._clearEventLog}>Clear</button>
          </div>
        </div>
        <div class="event-log-list">
          ${this._eventLogEntries.length === 0 ? m`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (t) => m`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${t.ts}] ${t.type}</div>
                    <div>${t.message}</div>
                    ${t.data !== void 0 ? m`<div class="event-log-meta">${this._safeStringify(t.data)}</div>` : ""}
                  </div>
                `
    )}
        </div>
      </div>
    `;
  }
  _shouldTrackEntity(t) {
    return this._eventLogScope === "all" ? this._isTrackedEntity(t) : this._isTrackedEntityInSelectedSubtree(t);
  }
  _isTrackedEntity(t) {
    var i, o;
    const e = /* @__PURE__ */ new Set();
    for (const a of this._locations) {
      for (const s of a.entity_ids || []) e.add(s);
      const r = ((o = (i = a.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || [];
      for (const s of r) e.add(s.entity_id);
    }
    return e.has(t);
  }
  _isTrackedEntityInSelectedSubtree(t) {
    var i, o;
    const e = this._getSelectedSubtreeLocationIds();
    if (e.size === 0) return !1;
    for (const a of this._locations) {
      if (!e.has(a.id)) continue;
      if ((a.entity_ids || []).includes(t) || (((o = (i = a.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || []).some((s) => s.entity_id === t)) return !0;
    }
    return !1;
  }
  _getSelectedSubtreeLocationIds() {
    const t = /* @__PURE__ */ new Set();
    if (!this._selectedId) return t;
    t.add(this._selectedId);
    let e = !0;
    for (; e; ) {
      e = !1;
      for (const i of this._locations)
        i.parent_id && t.has(i.parent_id) && !t.has(i.id) && (t.add(i.id), e = !0);
    }
    return t;
  }
  _getEventLogScopeLabel() {
    if (this._eventLogScope === "all") return "all locations";
    const t = this._locations.find((i) => i.id === this._selectedId);
    if (!t) return "selected subtree";
    const e = this._getSelectedSubtreeLocationIds().size;
    return `${t.name} subtree (${e} locations)`;
  }
  _safeStringify(t) {
    try {
      return JSON.stringify(t);
    } catch {
      return String(t);
    }
  }
  _logEvent(t, e, i) {
    const o = {
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: t,
      message: e,
      data: i
    };
    this._eventLogEntries = [o, ...this._eventLogEntries].slice(0, 200);
  }
  _showKeyboardShortcutsHelp() {
    const e = [
      { key: "Drag", description: "Move location in hierarchy (tree handle)" },
      { key: "?", description: "Show this help" }
    ].map((i) => `${i.key}: ${i.description}`).join(`
`);
    alert(`Keyboard Shortcuts:

${e}`);
  }
  _getSelectedLocation() {
    if (this._selectedId)
      return this._locations.find((t) => t.id === this._selectedId);
  }
  /**
   * Batch save all pending changes
   * See: docs/history/2026.02.24-frontend-patterns.md Section 13.2
   */
  async _handleSaveChanges() {
    if (this._pendingChanges.size === 0 || this._saving) return;
    this._saving = !0;
    const t = Array.from(this._pendingChanges.entries()), e = await Promise.allSettled(
      t.map(([o, a]) => this._saveChange(o, a))
    ), i = e.filter((o) => o.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < e.length ? (this._showToast(`Saved ${e.length - i.length} changes, ${i.length} failed`, "warning"), t.forEach(([o, a], r) => {
      e[r].status === "fulfilled" && this._pendingChanges.delete(o);
    })) : this._showToast("Failed to save changes", "error"), this._saving = !1, await this._loadLocations();
  }
  /**
   * Discard all pending changes and reload from server.
   */
  async _handleDiscardChanges() {
    this._pendingChanges.size === 0 || this._discarding || (this._discarding = !0, this._pendingChanges.clear(), await this._loadLocations(!0), this._discarding = !1);
  }
  async _saveChange(t, e) {
    switch (e.type) {
      case "update":
        await this.hass.callWS({
          type: "topomation/locations/update",
          location_id: t,
          changes: e.updated
        });
        break;
      case "delete":
        await this.hass.callWS({
          type: "topomation/locations/delete",
          location_id: t
        });
        break;
      case "create":
        await this.hass.callWS({
          type: "topomation/locations/create",
          ...e.updated
        });
        break;
    }
  }
  _showToast(t, e = "success") {
    const i = new CustomEvent("hass-notification", {
      detail: {
        message: t,
        type: e === "error" ? "error" : void 0,
        duration: e === "error" ? 5e3 : 3e3
      },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(i), console.log(`[Toast:${e}] ${t}`);
  }
  async _seedDemoData() {
    this._showToast(
      "Demo seeding is disabled in this environment.",
      "warning"
    );
  }
};
we.properties = {
  hass: { attribute: !1 },
  narrow: { attribute: !1 },
  panel: { attribute: !1 },
  route: { attribute: !1 },
  // Internal state
  _locations: { state: !0 },
  _locationsVersion: { state: !0 },
  _selectedId: { state: !0 },
  _loading: { state: !0 },
  _error: { state: !0 },
  _pendingChanges: { state: !0 },
  _saving: { state: !0 },
  _discarding: { state: !0 },
  _locationDialogOpen: { state: !0 },
  _ruleDialogOpen: { state: !0 },
  _editingLocation: { state: !0 },
  _editingRule: { state: !0 },
  _ruleDialogDefaultTriggerType: { state: !0 },
  _renameConflict: { state: !0 },
  _newLocationDefaults: { state: !0 },
  _eventLogOpen: { state: !0 },
  _eventLogEntries: { state: !0 },
  _occupancyStateByLocation: { state: !0 }
}, we.styles = [
  Gt,
  Tt`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        display: flex;
        height: 100%;
        gap: 1px;
        background: var(--divider-color);
      }

      /* Tree Panel ~40% (min 300px) - from docs/history/2026.02.24-ui-design.md Section 2.1 */
      .panel-left {
        flex: 0 0 40%;
        min-width: 300px;
        max-width: 500px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Responsive - from docs/history/2026.02.24-ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          flex: 0 0 300px;
          min-width: 280px;
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        .panel-container {
          flex-direction: column;
        }

        .panel-left,
        .panel-right {
          flex: 1;
          min-width: unset;
          max-width: unset;
        }
      }

      /* Header styling - from docs/history/2026.02.24-ui-design.md Section 3.1.1 */
      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
        flex-shrink: 0;
      }

      .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
        margin-bottom: var(--spacing-md);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .property-context {
        margin: var(--spacing-md) var(--spacing-md) 0;
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.07);
      }

      .property-context-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .property-context-name {
        margin-top: 4px;
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .property-context-meta {
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      /* Loading and error states */
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .spinner {
        border: 3px solid var(--divider-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container {
        padding: var(--spacing-lg);
        color: var(--error-color);
        text-align: center;
      }

      .error-container h3 {
        margin-bottom: var(--spacing-md);
      }

      .error-container p {
        margin-bottom: var(--spacing-lg);
        color: var(--text-primary-color);
      }

      /* Rename conflict notification */
      .conflict-banner {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      [data-theme="dark"] .conflict-banner {
        background: #4a3f1f;
        border-left-color: #ffc107;
      }

      .conflict-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .conflict-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #856404;
      }

      [data-theme="dark"] .conflict-title {
        color: #ffc107;
      }

      .conflict-message {
        color: #856404;
      }

      [data-theme="dark"] .conflict-message {
        color: #ddd;
      }

      .conflict-actions {
        display: flex;
        gap: 8px;
      }

      .conflict-actions button {
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
      }

      .empty-state-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
        border-left: 4px solid var(--primary-color);
        border-radius: 0 4px 4px 0;
      }

      .empty-state-banner ha-icon {
        flex-shrink: 0;
        color: var(--primary-color);
      }

      .empty-state-banner-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--primary-text-color);
      }

      .empty-state-banner .button {
        flex-shrink: 0;
        text-decoration: none;
      }

      .event-log {
        margin: 0 var(--spacing-md) var(--spacing-md);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
        overflow: hidden;
      }

      .event-log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color);
        font-size: 12px;
        font-weight: 600;
      }

      .event-log-list {
        max-height: 220px;
        overflow: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 11px;
      }

      .event-log-item {
        padding: 6px 10px;
        border-bottom: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        line-height: 1.35;
      }

      .event-log-item:last-child {
        border-bottom: none;
      }

      .event-log-meta {
        color: var(--text-secondary-color);
      }

      .event-log-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `
];
let Xe = we;
if (!customElements.get("topomation-panel"))
  try {
    console.log("[topomation-panel] registering custom element"), customElements.define("topomation-panel", Xe);
  } catch (n) {
    console.error("[topomation-panel] failed to define element", n);
  }
export {
  Xe as TopomationPanel
};
