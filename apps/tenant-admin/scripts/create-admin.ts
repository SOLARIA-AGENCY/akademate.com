import { getPayload } from 'payload';
import config from '../src/payload.config.js';

async function createAdminUser() {
  try {
    console.log('Initializing Payload...');
    const payload = await getPayload({ config: await config });

    console.log('Creating admin user...');
    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Administrador CEP',
        email: 'admin@cepcomunicacion.com',
        password: 'CEPAdmin2025!SecurePass',
        role: 'admin',
      },
    });

    console.log('✅ Admin user created successfully:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   ID:', user.id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
