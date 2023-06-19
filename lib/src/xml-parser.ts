type Tag = {
  name: string,
  attributes: { [key: string]: string },
  children: Tag[],
  value: string,
}

export class XmlParser {
  constructor() {}

  private encodeCDATAValues(xmlText: string) {
    const cdataRegex = new RegExp(/<!\[CDATA\[([^\]\]]+)\]\]/gi);
    let result = cdataRegex.exec(xmlText);
    while (result) {
      if (result.length > 1) {
        xmlText = xmlText.replace(result[1], encodeURIComponent(result[1]));
      }

      result = cdataRegex.exec(xmlText);
    }

    return xmlText;
  }

  private parseTag(tagText: string) {
    const cleanTagText = tagText.match(/([^\s]*)=('([^']*?)'|"([^"]*?)")|([\/?\w\-\:]+)/g);

    if (!cleanTagText) {
      return null
    }

    const shiftedElement = cleanTagText.shift()

    if (!shiftedElement) {
      return null
    }

    const tag = {
      name: shiftedElement.replace(/\/\s*$/, ''),
      attributes: {},
      children: [],
      value: '',
    } as Tag;

    cleanTagText.map(attribute => {
      let attributeKeyVal = attribute.split('=');

      if (attributeKeyVal.length < 2) {
        return;
      }

      let attributeKey = attributeKeyVal[0];
      let attributeVal = '';

      if (attributeKeyVal.length === 2) {
        attributeVal = attributeKeyVal[1];
      } else {
        attributeKeyVal = attributeKeyVal.slice(1);
        attributeVal = attributeKeyVal.join('=');
      }

      tag.attributes[attributeKey] = 'string' === typeof attributeVal ? (attributeVal.replace(/^"/g, '').replace(/^'/g, '').replace(/"$/g, '').replace(/'$/g, '').trim()) : attributeVal;
    });

    return tag;
  }

  parseValue(tagValue: string) {
    if (tagValue.indexOf('CDATA') < 0) {
      return tagValue.trim();
    }

    return tagValue.substring(tagValue.lastIndexOf('[') + 1, tagValue.indexOf(']'));
  }

  private convertTagsArrayToTree(xml: Tag[]) {
    const xmlTree = [];

    while(xml.length > 0) {
      const tag = xml.shift();

      if (!tag) {
        break
      }

      if (tag.value.indexOf('</') > -1 || tag.name.match(/\/$/)) {
        tag.name = tag.name.replace(/\/$/, '').trim();
        tag.value = tag.value.substring(0, tag.value.indexOf('</')).trim();
        xmlTree.push(tag);
        continue;
      }

      if (tag.name.indexOf('/') == 0) {
        break;
      }

      xmlTree.push(tag);
      tag.children = this.convertTagsArrayToTree(xml);
      tag.value = decodeURIComponent(tag.value.trim());
    }
    return xmlTree;
  }

  convertTagToText(tag: Tag) {
    let tagText = '<' + tag.name;

    for (let attribute in tag.attributes) {
      tagText += ' ' + attribute + '="' + tag.attributes[attribute] + '"';
    }

    if (tag.value.length > 0) {
      tagText += '>' + tag.value;
    } else {
      tagText += '>';
    }

    if (tag.children.length === 0) {
      tagText += '</' + tag.name + '>';
    }

    return tagText;
  }

  parseFromString(xmlText: string) {
    xmlText = this.encodeCDATAValues(xmlText);

    const cleanXmlText = xmlText.replace(/\s{2,}/g, ' ').replace(/\\t\\n\\r/g, '').replace(/>/g, '>\n').replace(/\]\]/g, ']]\n').replace(/\s<mentioned-user\s/g, '\n<mentioned-user ');
    const rawXmlData: Tag[] = [];

    cleanXmlText.split('\n').map(element => {
      element = element.trim();

      if (!element || element.indexOf('?xml') > -1) {
        return;
      }

      if (element.indexOf('<') == 0 && element.indexOf('CDATA') < 0) {
        const parsedTag = this.parseTag(element);

        if (!parsedTag) {
          return
        }

        rawXmlData.push(parsedTag);

        if (element.match(/\/\s*>$/)) {
          const tag = this.parseTag('</' + parsedTag.name + '>')

          tag && rawXmlData.push(tag);
        }
      } else {
        const parsedValue = this.parseValue(element)

        rawXmlData[rawXmlData.length - 1].value += ` ${parsedValue}`;
      }
    });

    return this.convertTagsArrayToTree(rawXmlData)[0];
  }

  toString(xml: Tag) {
    let xmlText = this.convertTagToText(xml);

    if (xml.children.length > 0) {
      xml.children.map(child => {
        xmlText += this.toString(child);
      });

      xmlText += '</' + xml.name + '>';
    }

    return xmlText;
  }
}
