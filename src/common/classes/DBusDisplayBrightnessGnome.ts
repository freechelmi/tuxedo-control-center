/*!
 * Copyright (c) 2019 TUXEDO Computers GmbH <tux@tuxedocomputers.com>
 *
 * This file is part of TUXEDO Control Center.
 *
 * TUXEDO Control Center is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * TUXEDO Control Center is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TUXEDO Control Center.  If not, see <https://www.gnu.org/licenses/>.
 */
const dbus = require('dbus-next');

export type OnChangedFunction = (value: number) => void;

export class DBusDisplayBrightnessGnome {

    private interface: any;

    private destination = 'org.gnome.SettingsDaemon.Power';
    private path = '/org/gnome/SettingsDaemon/Power';

    private propertyInterface = 'org.gnome.SettingsDaemon.Power.Screen';
    private methodName = 'Brightness';
    private methodReturnType = 'i';

    private customOnPropertiesChanged: OnChangedFunction;
    private eventEmitter: NodeJS.EventEmitter;

    constructor(private bus: any) {
        this.getInterface().then((iface) => {
            if (iface === undefined) { return; }
            this.eventEmitter = iface.on('PropertiesChanged', (interfaceString, changed, invalidated) => {
                const changedValueExists = changed.hasOwnProperty('Brightness') && changed.Brightness.hasOwnProperty('value');
                const interfaceMatch = interfaceString === this.propertyInterface;
                const callbackDefined = this.customOnPropertiesChanged !== undefined;
                if (interfaceMatch && changedValueExists && callbackDefined) {
                    this.customOnPropertiesChanged(changed.Brightness.value);
                }
            });
        }).catch((err) => {
        });
    }

    public getDescriptiveString(): string {
        return 'org.gnome.SettingsDaemon';
    }

    public async isAvailable(): Promise<boolean> {
        return new Promise<boolean>(async resolve => {
            try {
                const iface = await this.getInterface();
                if (iface === undefined) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            } catch (err) {
                resolve(false);
            }
        });
    }

    public setOnPropertiesChanged(f: OnChangedFunction): void {
        this.customOnPropertiesChanged = f;
    }

    public cleanUp(): void {
        if (this.eventEmitter !== undefined) {
            this.eventEmitter.removeAllListeners();
        }
    }

    public async getInterface(): Promise<any> {
        return new Promise<any>((resolve) => {
            if (this.interface !== undefined) { resolve(this.interface); return; }
            // Initialize interface
            this.bus.getProxyObject(this.destination, this.path).then(
                (proxyObject) => {
                    this.interface = proxyObject.getInterface('org.freedesktop.DBus.Properties');
                    resolve(this.interface);
                }
            ).catch(() => {
                this.interface = undefined;
                resolve(this.interface);
            });
        });
    }

    public async getBrightness(): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const iface = await this.getInterface();
                if (iface !== undefined) {
                    const result = await iface.Get(this.propertyInterface, this.methodName);
                    resolve(result.value);
                } else {
                    reject(new Error('Interface not available'));
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    public async setBrightness(valuePercent: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const iface = await this.getInterface();
                if (iface !== undefined) {
                    await iface.Set(this.propertyInterface, this.methodName, new dbus.Variant(this.methodReturnType, valuePercent));
                    resolve();
                } else {
                    reject(new Error('Interface not available'));
                }
            } catch (err) {
                reject(err);
            }
        });
    }
}
