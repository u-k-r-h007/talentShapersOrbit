import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'WebPartStrings';
import App from './App';
import pnp from 'sp-pnp-js';
import 'bootstrap/dist/css/bootstrap.min.css';

export interface IWebPartProps {
  description: string;
}


export default class WebPart extends BaseClientSideWebPart<IWebPartProps> {


  public render(): void {
    const element: React.ReactElement = React.createElement(App);

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return super.onInit().then(_ =>{
     pnp.setup({
      spfxContext: this.context
    });
    });
  }




  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
